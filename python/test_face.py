#!/usr/bin/env python3
"""
Test script to preview the face rendering locally.
Run: python3 test_face.py
"""

import time
import os
from PIL import Image
from face import Face, LottieFace, LOTTIE_AVAILABLE


def test_procedural_face():
    """Test the procedural robot face."""
    print("\n" + "=" * 40)
    print("Testing Procedural Robot Face")
    print("=" * 40)

    face = Face(width=240, height=280)
    expressions = ["normal", "happy", "sad", "angry", "surprised"]

    for expr in expressions:
        print(f"  Rendering: {expr}")
        face.set_expression(expr)
        face.update()
        frame = face.render()
        frame.save(f"face_preview_{expr}.png")

    print("  Saved expression previews")


def test_lottie_face():
    """Test the Lottie animation face."""
    print("\n" + "=" * 40)
    print("Testing Lottie Animation Face")
    print("=" * 40)

    lottie_path = os.path.join(os.path.dirname(__file__), "assets", "Animated Clown Face.lottie")

    if not os.path.exists(lottie_path):
        print(f"  Lottie file not found: {lottie_path}")
        return

    if not LOTTIE_AVAILABLE:
        print("  rlottie-python not installed. Install with: pip install rlottie-python[full]")
        return

    face = LottieFace(lottie_path, width=240, height=280)
    print(f"  Loaded: {lottie_path}")
    print(f"  Frames: {face.total_frames}, FPS: {face.frame_rate}, Duration: {face.duration:.2f}s")

    # Save a few sample frames
    for frame_num in [0, 30, 60, 90, 120]:
        face.current_frame = frame_num
        frame = face.render()
        frame.save(f"lottie_frame_{frame_num:03d}.png")
        print(f"  Saved: lottie_frame_{frame_num:03d}.png")

    # Create animated GIF
    print("\n  Creating animated GIF...")
    gif_frames = []
    face.current_frame = 0
    face.last_update_time = time.time()

    # Capture frames for the full animation loop
    for i in range(face.total_frames):
        face.current_frame = i
        frame = face.render().convert("P", palette=Image.ADAPTIVE, colors=256)
        gif_frames.append(frame)

    gif_frames[0].save(
        "lottie_animation.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=int(1000 / face.frame_rate),  # Convert fps to ms per frame
        loop=0
    )
    print("  Saved: lottie_animation.gif")


def main():
    print("Face Preview Test")

    # Test procedural face
    test_procedural_face()

    # Test Lottie face if available
    test_lottie_face()

    print("\n" + "=" * 40)
    print("Done! Open the generated files to preview.")


if __name__ == "__main__":
    main()
