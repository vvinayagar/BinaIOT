sudo systemctl daemon-reload
sudo systemctl restart gunicorn
sudo journalctl -u gunicorn -f