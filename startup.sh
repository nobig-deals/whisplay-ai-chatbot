#!/bin/bash

# Get current user and directory
CURRENT_USER=$(whoami)
CURRENT_DIR=$(pwd)
USER_ID=$(id -u)

echo "Setting up chatbot service for user: $CURRENT_USER"
echo "Working directory: $CURRENT_DIR"

# disable graphical interface (optional - comment out if you want GUI)
# sudo systemctl set-default multi-user.target

echo "Creating chatbot service file..."

sudo bash -c "cat > /etc/systemd/system/chatbot.service <<EOF
[Unit]
Description=Chatbot Service
After=network.target sound.target
Wants=sound.target

[Service]
Type=simple
User=$CURRENT_USER
Group=audio
SupplementaryGroups=audio

WorkingDirectory=$CURRENT_DIR
ExecStart=/bin/bash $CURRENT_DIR/run_chatbot.sh

# Environment variables (ALSA / mpg123 are very important)
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/home/$CURRENT_USER/.local/bin
Environment=HOME=/home/$CURRENT_USER
Environment=XDG_RUNTIME_DIR=/run/user/$USER_ID

# Make sure the service has access to audio devices
PrivateDevices=no

StandardOutput=append:$CURRENT_DIR/chatbot.log
StandardError=append:$CURRENT_DIR/chatbot.log

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

echo "Chatbot service file created."
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling and starting the chatbot service..."
sudo systemctl enable chatbot.service
sudo systemctl start chatbot.service

echo "Done! Check status with: sudo systemctl status chatbot.service"
echo "View logs with: tail -f $CURRENT_DIR/chatbot.log"