"""
Face expression renderer for Whisplay bot display.
Inspired by Akno project - uses vector shapes for expressive robot eyes.
"""

import time
import random
from PIL import Image, ImageDraw


class Face:
    """Renders an animated robot face with expressive eyes."""

    def __init__(self, width=240, height=280):
        self.width = width
        self.height = height

        # Eye configuration (scaled for 240x280 display)
        self.eye_width = 70
        self.eye_height = 50
        self.eye_radius = 12
        self.eye_spacing = 30  # Gap between eyes
        self.eye_y = 100  # Vertical position from top

        # Calculate eye positions (centered)
        total_eye_width = (self.eye_width * 2) + self.eye_spacing
        self.left_eye_x = (width - total_eye_width) // 2
        self.right_eye_x = self.left_eye_x + self.eye_width + self.eye_spacing

        # Mouth configuration
        self.mouth_y = 190
        self.mouth_width = 60

        # Animation state
        self.blink_state = 0.0  # 0 = open, 1 = closed
        self.is_blinking = False
        self.last_blink_time = time.time()
        self.next_blink_delay = random.uniform(2.0, 5.0)
        self.blink_duration = 0.15  # How long a blink takes
        self.blink_start_time = 0

        # Eye color
        self.eye_color = (255, 255, 255)  # White eyes
        self.bg_color = (0, 0, 0)  # Black background

        # Current expression
        self.expression = "normal"

    def update(self):
        """Update animation state. Call this every frame."""
        current_time = time.time()

        # Handle blinking
        if self.is_blinking:
            # Calculate blink progress
            elapsed = current_time - self.blink_start_time
            half_duration = self.blink_duration / 2

            if elapsed < half_duration:
                # Closing
                self.blink_state = elapsed / half_duration
            elif elapsed < self.blink_duration:
                # Opening
                self.blink_state = 1.0 - ((elapsed - half_duration) / half_duration)
            else:
                # Blink complete
                self.is_blinking = False
                self.blink_state = 0.0
                self.last_blink_time = current_time
                self.next_blink_delay = random.uniform(2.0, 5.0)
        else:
            # Check if it's time to blink
            if current_time - self.last_blink_time >= self.next_blink_delay:
                self.is_blinking = True
                self.blink_start_time = current_time

    def render(self) -> Image.Image:
        """Render the current face frame."""
        # Create black background
        image = Image.new("RGBA", (self.width, self.height), self.bg_color)
        draw = ImageDraw.Draw(image)

        # Render based on expression
        if self.expression == "normal":
            self._render_normal_eyes(draw)
        elif self.expression == "happy":
            self._render_happy_eyes(draw)
        elif self.expression == "sad":
            self._render_sad_eyes(draw)
        elif self.expression == "angry":
            self._render_angry_eyes(draw)
        elif self.expression == "surprised":
            self._render_surprised_eyes(draw)
        else:
            self._render_normal_eyes(draw)

        # Render mouth
        self._render_mouth(draw)

        return image

    def _render_normal_eyes(self, draw: ImageDraw.Draw):
        """Render normal eyes with blink animation."""
        # Calculate eye height based on blink state
        current_height = int(self.eye_height * (1.0 - self.blink_state * 0.9))
        current_height = max(current_height, 6)  # Minimum height when blinking

        # Adjust Y position to keep eyes centered during blink
        y_offset = int((self.eye_height - current_height) / 2)

        # Left eye
        draw.rounded_rectangle(
            [
                self.left_eye_x,
                self.eye_y + y_offset,
                self.left_eye_x + self.eye_width,
                self.eye_y + y_offset + current_height
            ],
            radius=min(self.eye_radius, current_height // 2),
            fill=self.eye_color
        )

        # Right eye
        draw.rounded_rectangle(
            [
                self.right_eye_x,
                self.eye_y + y_offset,
                self.right_eye_x + self.eye_width,
                self.eye_y + y_offset + current_height
            ],
            radius=min(self.eye_radius, current_height // 2),
            fill=self.eye_color
        )

    def _render_happy_eyes(self, draw: ImageDraw.Draw):
        """Render happy/curved eyes (like ^_^)."""
        # Draw base eyes
        self._render_normal_eyes(draw)

        # Cut out bottom with large circles to create curved happy eyes
        if self.blink_state < 0.5:  # Only when not fully blinking
            circle_radius = 45
            circle_y = self.eye_y + self.eye_height + circle_radius - 20

            # Left eye curve
            draw.ellipse(
                [
                    self.left_eye_x + self.eye_width // 2 - circle_radius,
                    circle_y - circle_radius,
                    self.left_eye_x + self.eye_width // 2 + circle_radius,
                    circle_y + circle_radius
                ],
                fill=self.bg_color
            )

            # Right eye curve
            draw.ellipse(
                [
                    self.right_eye_x + self.eye_width // 2 - circle_radius,
                    circle_y - circle_radius,
                    self.right_eye_x + self.eye_width // 2 + circle_radius,
                    circle_y + circle_radius
                ],
                fill=self.bg_color
            )

    def _render_sad_eyes(self, draw: ImageDraw.Draw):
        """Render sad eyes with downward-slanting eyebrows."""
        # Draw base eyes
        self._render_normal_eyes(draw)

        # Draw sad eyebrows (triangles slanting down outward)
        if self.blink_state < 0.5:
            brow_height = 20

            # Left eyebrow (slants down to the left)
            draw.polygon(
                [
                    (self.left_eye_x - 5, self.eye_y - 5),
                    (self.left_eye_x + self.eye_width + 5, self.eye_y - 5),
                    (self.left_eye_x - 5, self.eye_y + brow_height)
                ],
                fill=self.bg_color
            )

            # Right eyebrow (slants down to the right)
            draw.polygon(
                [
                    (self.right_eye_x - 5, self.eye_y - 5),
                    (self.right_eye_x + self.eye_width + 5, self.eye_y - 5),
                    (self.right_eye_x + self.eye_width + 5, self.eye_y + brow_height)
                ],
                fill=self.bg_color
            )

    def _render_angry_eyes(self, draw: ImageDraw.Draw):
        """Render angry eyes with V-shaped eyebrows."""
        # Draw base eyes
        self._render_normal_eyes(draw)

        # Draw angry eyebrows (triangles pointing inward)
        if self.blink_state < 0.5:
            brow_height = 25
            center_x = self.width // 2

            # V-shaped angry brow
            draw.polygon(
                [
                    (self.left_eye_x - 10, self.eye_y - 5),
                    (center_x, self.eye_y + brow_height),
                    (self.right_eye_x + self.eye_width + 10, self.eye_y - 5),
                    (center_x, self.eye_y - 5)
                ],
                fill=self.bg_color
            )

    def _render_surprised_eyes(self, draw: ImageDraw.Draw):
        """Render surprised/wide eyes."""
        # Make eyes bigger and rounder
        extra_height = 15
        current_height = self.eye_height + extra_height
        y_offset = -extra_height // 2

        # Apply blink
        if self.blink_state > 0:
            current_height = int(current_height * (1.0 - self.blink_state * 0.9))
            current_height = max(current_height, 6)
            y_offset = int((self.eye_height + extra_height - current_height) / 2) - extra_height // 2

        # Left eye (rounder)
        draw.rounded_rectangle(
            [
                self.left_eye_x - 5,
                self.eye_y + y_offset,
                self.left_eye_x + self.eye_width + 5,
                self.eye_y + y_offset + current_height
            ],
            radius=min(self.eye_radius + 5, current_height // 2),
            fill=self.eye_color
        )

        # Right eye (rounder)
        draw.rounded_rectangle(
            [
                self.right_eye_x - 5,
                self.eye_y + y_offset,
                self.right_eye_x + self.eye_width + 5,
                self.eye_y + y_offset + current_height
            ],
            radius=min(self.eye_radius + 5, current_height // 2),
            fill=self.eye_color
        )

    def _render_mouth(self, draw: ImageDraw.Draw):
        """Render a simple curved mouth."""
        mouth_x = (self.width - self.mouth_width) // 2

        # Simple curved line for mouth
        draw.arc(
            [
                mouth_x,
                self.mouth_y - 10,
                mouth_x + self.mouth_width,
                self.mouth_y + 20
            ],
            start=0,
            end=180,
            fill=self.eye_color,
            width=3
        )

    def set_expression(self, expression: str):
        """Set the current expression."""
        valid_expressions = ["normal", "happy", "sad", "angry", "surprised"]
        if expression in valid_expressions:
            self.expression = expression

    def set_eye_color(self, color: tuple):
        """Set eye color as RGB tuple."""
        self.eye_color = color
