import { WaveShape } from '../wave/WaveShape';

export type SurfControls = { x: number; y: number; verticalConflict: boolean };
export type SurfState = 'riding' | 'airborne' | 'wipedOut';

const STEP = 1 / 60;
const MIN_STROKE_HOLD = 0.1;
const STROKE_COOLDOWN = 0.16;
const UP_ACCELERATION = 560;
const DOWN_ACCELERATION = 340;
const VERTICAL_DRIVE = 230;
const TURN_SPEED = 180;
const BOARD_HEADING = 25;
const UP_TILT = -55;
const DOWN_TILT = 24;
const MAX_SPEED = 560;
const CAMERA_ANCHOR = 0.8;
const AERIAL_MIN_FORWARD_SPEED = 175;
const AIR_LAUNCH_SPEED = 300;
const AIR_GRAVITY = 600;
const LANDING_ANGLE_TOLERANCE = 35;

/** Fixed-step arcade surf motion in screen pixels per second. */
export class SurfPhysics {
  x = 0.72;
  y = 0.68;
  vx = 0;
  vy = 0;
  angle = 0;
  state: SurfState = 'riding';
  bodyHeight = 0;
  foamContact = 0;
  idleFlex = false;
  airHeight = 0;
  landedAerialTime = 0;
  /** Screen pixels the wave moved left during the latest update. */
  cameraShift = 0;
  private accumulator = 0;
  private turnAngle = 0;
  private trimAngle = 0;
  private idleTime = 0;
  private strokeDirection = 0;
  private strokeHold = 0;
  private strokeGap = 0;
  private strokeCooldown = 0;
  private foamRisk = 0;
  private wipeoutTime = 0;
  private airVelocity = 0;
  private takeoffAngle = 0;
  private aerialCooldown = 0;
  private upArmed = true;

  update(deltaMs: number, controls: SurfControls, shape: WaveShape,
    width: number, height: number, size: number): void {
    this.cameraShift = 0;
    // Ignore a long background-tab gap, then advance in stable increments.
    this.accumulator = Math.min(0.1, this.accumulator + Math.max(0, deltaMs) / 1000);
    while (this.accumulator >= STEP) {
      this.step(STEP, controls, shape, width, height, size);
      this.accumulator -= STEP;
    }
  }

  resize(shape: WaveShape, width: number, height: number, size: number): void {
    this.bodyHeight = size * (this.idleFlex ? 0.36 : 0.56);
    this.constrain(shape, width, height, size);
  }

  cancelStroke(): void {
    this.strokeDirection = 0;
    this.strokeHold = 0;
    this.strokeGap = 0;
    this.strokeCooldown = 0;
  }

  private step(dt: number, controls: SurfControls, shape: WaveShape,
    width: number, height: number, size: number): void {
    const { x: turn, y: trim, verticalConflict } = controls;
    this.aerialCooldown = Math.max(0, this.aerialCooldown - dt);
    this.landedAerialTime = Math.max(0, this.landedAerialTime - dt);
    if (trim >= 0) this.upArmed = true;
    if (this.state === 'wipedOut') {
      this.wipeoutTime -= dt;
      this.angle += 220 * dt;
      this.vx *= Math.exp(-2.4 * dt);
      this.vy = Math.min(170, this.vy + 130 * dt);
      this.x += this.vx * dt / width;
      this.y += this.vy * dt / height;
      if (this.wipeoutTime <= 0) this.reset(shape);
      return;
    }
    if (this.state === 'airborne') {
      this.advanceAerial(dt, turn, shape, width, height, size);
      return;
    }

    // Left/Right keep turning through complete rotations and hold the new
    // orientation on release. Up/Down add a temporary climb/descent tilt.
    this.turnAngle += turn * TURN_SPEED * dt;
    const targetTrimAngle = trim < 0 ? UP_TILT : trim > 0 ? DOWN_TILT : 0;
    this.trimAngle += (targetTrimAngle - this.trimAngle) * (1 - Math.exp(-8 * dt));
    this.angle = this.turnAngle + this.trimAngle;
    const idle = turn === 0 && trim === 0 && !verticalConflict;
    const noVerticalInput = trim === 0;
    this.idleTime = idle ? this.idleTime + dt : 0;
    this.idleFlex = idle && this.idleTime % 1.55 >= 0.85 && this.idleTime % 1.55 < 1.3;
    this.bodyHeight = size * (this.idleFlex || trim > 0 ? 0.36 : 0.56);

    // A spin changes presentation; Up/Down still travel forward on the wave.
    const travelHeading = (BOARD_HEADING + targetTrimAngle) * Math.PI / 180;
    const halfBoard = size * 0.35 / width;
    const water = shape.physicsAt(this.x, this.y, halfBoard);
    this.foamContact = water.foam;
    this.strokeCooldown = Math.max(0, this.strokeCooldown - dt);
    if (verticalConflict) {
      // Opposing arrows cancel the motion and cannot count as a stroke.
      this.cancelStroke();
    } else if (trim === 0) {
      this.strokeGap += dt;
      if (this.strokeGap > 0.65) this.cancelStroke();
    } else if (trim === this.strokeDirection) {
      this.strokeHold += dt;
      this.strokeGap = 0;
    } else {
      if (this.strokeDirection !== 0 && this.strokeHold >= MIN_STROKE_HOLD
        && this.strokeGap <= 0.65 && this.strokeCooldown === 0) {
        // Climb then drop (or drop then climb) transfers weight into speed.
        const impulse = (145 + Math.min(this.strokeHold, 0.6) * 170)
          * (0.9 + water.slope * 0.45);
        this.vx += Math.cos(travelHeading) * impulse;
        this.vy += trim * impulse * 0.15;
        this.strokeCooldown = STROKE_COOLDOWN;
      }
      this.strokeDirection = trim;
      this.strokeHold = dt;
      this.strokeGap = 0;
    }
    // Only climbing and descending add forward drive. Left and Right rotate
    // the board without generating speed of their own.
    const drive = 25 + 75 * water.slope + (trim !== 0 ? VERTICAL_DRIVE : 0)
      + (trim < 0 ? 170 : 0);
    // Up and Down move diagonally even while the board is spinning.
    this.vx += (Math.cos(travelHeading) * drive + 12 + water.foam * 210) * dt;
    this.vy += (noVerticalInput ? water.foam * 70
      : 80 + water.slope * 100 + Math.sin(travelHeading) * drive * 0.6
        + trim * (trim < 0 ? UP_ACCELERATION : DOWN_ACCELERATION)
        + water.foam * 70) * dt;
    const drag = Math.exp(-(1.15 + water.foam * 4.2) * dt);
    this.vx *= drag;
    this.vy *= noVerticalInput ? Math.exp(-(9 + water.foam * 4.2) * dt) : drag;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      this.vx *= MAX_SPEED / speed;
      this.vy *= MAX_SPEED / speed;
    }

    this.x += this.vx * dt / width;
    this.y += this.vy * dt / height;
    const lip = Math.max(0.32, shape.crestAt(this.x) + this.bodyHeight / height);
    if (trim < 0 && this.upArmed && this.aerialCooldown === 0
      && this.vx >= AERIAL_MIN_FORWARD_SPEED && this.y <= lip + 0.008) {
      this.y = lip;
      this.beginAerial();
      this.followCamera(shape, width);
      return;
    }
    this.followCamera(shape, width);
    this.constrain(shape, width, height, size);

    // Brief brushes are recoverable; driving hard into the breaker is not.
    this.foamRisk = water.foam > 0.38
      ? this.foamRisk + dt * water.foam * (speed > 145 ? 1.8 : 1)
      : Math.max(0, this.foamRisk - dt * 1.5);
    if (this.foamRisk > 0.32 || (water.foam > 0.88 && speed > 300)) {
      this.wipeOut();
    }
  }

  private beginAerial(): void {
    this.state = 'airborne';
    this.upArmed = false;
    this.airHeight = 0;
    this.airVelocity = AIR_LAUNCH_SPEED;
    this.takeoffAngle = this.angle;
    this.vy = 0;
    this.foamContact = 0;
    this.foamRisk = 0;
    this.idleFlex = false;
    this.cancelStroke();
  }

  private advanceAerial(dt: number, turn: number, shape: WaveShape,
    width: number, height: number, size: number): void {
    // The board keeps its takeoff pitch while Left/Right control the spin.
    this.turnAngle += turn * TURN_SPEED * dt;
    this.angle = this.turnAngle + this.trimAngle;
    this.vx *= Math.exp(-0.22 * dt);
    this.x += this.vx * dt / width;
    this.y += 28 * dt / height;
    this.followCamera(shape, width);
    this.airHeight += this.airVelocity * dt;
    this.airVelocity -= AIR_GRAVITY * dt;
    if (this.airHeight > 0) return;

    this.airHeight = 0;
    this.y = Math.max(this.y, shape.crestAt(this.x) + this.bodyHeight / height + 0.01);
    const rotation = ((this.angle - this.takeoffAngle) % 360 + 360) % 360;
    if (Math.abs(rotation - 180) > LANDING_ANGLE_TOLERANCE) {
      this.wipeOut();
      return;
    }
    this.state = 'riding';
    this.vy = 70;
    this.foamRisk = 0;
    this.aerialCooldown = 1;
    this.landedAerialTime = 1;
    this.constrain(shape, width, height, size);
  }

  private followCamera(shape: WaveShape, width: number): void {
    if (this.x <= CAMERA_ANCHOR) return;
    const shift = (this.x - CAMERA_ANCHOR) * width;
    shape.followSurfer(shift, width);
    this.cameraShift += shift;
    this.x = CAMERA_ANCHOR;
  }

  private wipeOut(): void {
    this.state = 'wipedOut';
    this.wipeoutTime = 1.1;
    this.airHeight = 0;
    this.vx *= 0.4;
    this.vy = Math.max(60, this.vy * 0.5);
    this.cancelStroke();
  }

  private constrain(shape: WaveShape, width: number, height: number, size: number): void {
    const top = Math.max(0.32, shape.crestAt(this.x) + this.bodyHeight / height);
    const bottom = 0.84;
    if (this.y < top) { this.y = top; this.vy = Math.max(0, this.vy); }
    if (this.y > bottom) { this.y = bottom; this.vy = Math.min(0, this.vy); }

    const boardMargin = size * 0.35 / width;
    // Permit contact with foam, but keep the board out of deep whitewater.
    const left = shape.breakAt(this.y) - shape.foamWidthAt(this.y) * 0.5 + boardMargin * 0.5;
    const right = 1 - boardMargin - 0.025;
    if (this.x < left) { this.x = left; this.vx = Math.max(0, this.vx); }
    if (this.x > right) { this.x = right; this.vx = Math.min(0, this.vx); }
  }

  private reset(shape: WaveShape): void {
    shape.resetFront();
    this.x = 0.72;
    this.y = 0.68;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.turnAngle = 0;
    this.trimAngle = 0;
    this.airHeight = 0;
    this.airVelocity = 0;
    this.aerialCooldown = 0;
    this.landedAerialTime = 0;
    this.upArmed = true;
    this.state = 'riding';
    this.foamContact = 0;
    this.idleTime = 0;
    this.idleFlex = false;
    this.foamRisk = 0;
    this.wipeoutTime = 0;
    this.cancelStroke();
  }
}
