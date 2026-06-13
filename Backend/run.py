from app import create_app
from scheduler import start_scheduler

start_scheduler()

app = create_app()

if __name__ == "__main__":
    start_scheduler()
    app.run(host="0.0.0.0", port=5050, debug=True)
