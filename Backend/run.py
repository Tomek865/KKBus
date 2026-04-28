from app import create_app

app = create_app()

if __name__ == "__main__":
    # Tryb debug jest świetny do developmentu, w produkcji ustawiamy na False
    app.run(host="0.0.0.0", port=5000, debug=True)
