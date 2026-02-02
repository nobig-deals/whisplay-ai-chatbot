#!/usr/bin/env python3
"""
Test script to preview the face rendering locally.
Run: python3 test_face.py
"""

import time
from PIL import Image
from face import Face


def main():
    print("Face Preview Test")
    print("=" * 40)

    # Create face with display dimensions
    face = Face(width=240, height=280)

    # Test all expressions
    expressions = ["normal", "happy", "sad", "angry", "surprised"]

    for expr in expressions:
        print(f"\nRendering expression: {expr}")
        face.set_expression(expr)

        # Render a few frames to show the blink animation
        frames = []
        for i in range(90):  # 3 seconds at 30fps
            face.update()
            frame = face.render()
            frames.append(frame.copy())

        # Save the first frame as a preview
        frames[0].save(f"face_preview_{expr}.png")
        print(f"  Saved: face_preview_{expr}.png")

    # Create an animated GIF showing the idle blink
    print("\nCreating animated GIF with blink animation...")
    face.set_expression("normal")
    face.last_blink_time = time.time()  # Reset blink timer
    face.next_blink_delay = 1.0  # Blink sooner for demo

    gif_frames = []
    for i in range(120):  # 4 seconds
        face.update()
        frame = face.render().convert("P", palette=Image.ADAPTIVE, colors=16)
        gif_frames.append(frame)
        time.sleep(1/30)  # Simulate 30fps timing

    gif_frames[0].save(
        "face_animation.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=33,  # ~30fps
        loop=0
    )
    print("Saved: face_animation.gif")

    print("\n" + "=" * 40)
    print("Preview files created! Open them to see the face.")


if __name__ == "__main__":
    main()
