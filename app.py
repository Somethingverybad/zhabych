import os
import sqlite3
import requests
from flask import Flask, render_template, request, jsonify, g
from pathlib import Path

app = Flask(__name__)

# Конфигурация
BASE_DIR = Path(__file__).parent
app.config['DATABASE'] = str(BASE_DIR / 'instance' / 'scores.db')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Замените на реальный секретный ключ

# 🔐 Telegram настройки
TELEGRAM_BOT_TOKEN = "5860471491:AAGbYiQVM2wXkRk1PRct6ZnMchtkEqeBRyk"
TELEGRAM_CHAT_ID = "1423772931"


# Создаем необходимые директории
os.makedirs(BASE_DIR / 'instance', exist_ok=True)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_db():
    """Получаем соединение с базой данных, создаем таблицу если ее нет"""
    if 'db' not in g:
        try:
            g.db = sqlite3.connect(app.config['DATABASE'])
            g.db.row_factory = sqlite3.Row
            
            # Создаем таблицу если она не существует
            g.db.execute('''
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            g.db.commit()
        except sqlite3.Error as e:
            app.logger.error(f"Database connection error: {e}")
            raise
    return g.db

@app.teardown_appcontext
def close_db(error):
    """Закрываем соединение с БД при завершении контекста"""
    if hasattr(g, 'db'):
        g.db.close()

def init_db():
    """Инициализация базы данных"""
    with app.app_context():
        db = get_db()
        try:
            db.execute('''
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            db.commit()
        except sqlite3.Error as e:
            app.logger.error(f"Database initialization error: {e}")
            raise

# API endpoints
@app.route('/api/scores', methods=['POST'])
def add_score():
    """Добавление нового результата в таблицу рекордов"""
    data = request.get_json()
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO scores (name, score) VALUES (?, ?)',
            (data['name'], int(data['score'])))
        db.commit()
        return jsonify({'success': True}), 201
    except sqlite3.Error as e:
        app.logger.error(f"Database error: {e}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        app.logger.error(f"Server error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/scores', methods=['GET'])
def get_scores():
    """Получение топ-10 результатов"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT name, score 
            FROM scores 
            ORDER BY score DESC 
            LIMIT 10
        ''')
        scores = cursor.fetchall()
        return jsonify([dict(score) for score in scores])
    except sqlite3.Error as e:
        app.logger.error(f"Database error: {e}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

# Роуты для страниц
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/zg1/")
def zagadka1():
    return render_template("zagadka1.html")

@app.route("/zg2/")
def zagadka2():
    return render_template("zagadka2.html")

@app.route("/zg3/")
def zagadka3():
    return render_template("zagadka3.html")

@app.route("/assoc1/")
def associative1():
    return render_template("associative1.html")

@app.route("/go/")
def go():
    return render_template("leaves.html")

@app.route("/assoc2/")
def associative2():
    return render_template("associative2.html")

@app.route("/assoc3/")
def associative3():
    return render_template("associative3.html")

@app.route("/photo_upload_1/")
def photo_upload_page1():
    return render_template("photo_upload_1.html")

@app.route("/room1/")
def room1():
    return render_template("room1.html")

@app.route("/room2/")
def room2():
    return render_template("room2.html")

@app.route("/room3/")
def room3():
    return render_template("room3.html")

@app.route("/photo_upload_2/")
def photo_upload_page2():
    return render_template("photo_upload_2.html")

@app.route("/step1/")
def step1():
    return render_template("step1.html")

@app.route("/step2/")
def step2():
    return render_template("step2.html")

@app.route("/step3/")
def step3():
    return render_template("step3.html")

@app.route("/photo_upload_3/")
def photo_upload_page3():
    return render_template("photo_upload_3.html")

@app.route("/upload_photo", methods=["POST"])
def upload_photo():
    """Загрузка фото и отправка в Telegram"""
    if 'photo' not in request.files:
        return jsonify({"success": False, "error": "No file part"})

    file = request.files['photo']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"})

    try:
        # Сохраняем временно
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        # Отправляем в Telegram
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
        with open(filepath, 'rb') as photo:
            response = requests.post(url, 
                data={'chat_id': TELEGRAM_CHAT_ID},
                files={'photo': photo}
            )

        os.remove(filepath)  # очищаем после отправки

        if response.status_code == 200:
            return jsonify({"success": True})
        return jsonify({"success": False, "error": response.text})
    
    except Exception as e:
        app.logger.error(f"Photo upload error: {e}")
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)