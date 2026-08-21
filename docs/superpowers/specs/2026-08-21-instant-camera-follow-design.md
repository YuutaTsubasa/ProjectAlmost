# Instant Camera Follow Design

## Problem

The centered gameplay camera used `0.12` horizontal and vertical follow lerp. During playtesting, movement and jumping appeared blurred whenever the camera moved, while the same animations remained clear with a stationary camera.

## Decision

Keep the existing centered, pixel-rounded follow behavior, but set both follow lerp values to `1`. The camera therefore follows the player immediately without adding a deadzone, follow offset, or predictive movement.

## Verification

- Capture the arguments passed to Phaser's `startFollow` in the renderer contract test.
- Require pixel rounding and `1` for both follow axes.
- Confirm through playtesting that camera-linked motion no longer produces the reported ghosting.

## Trade-off

Immediate following is less soft than interpolated following, but it avoids full-scene easing blur on the tested display and preserves the original centered framing.
