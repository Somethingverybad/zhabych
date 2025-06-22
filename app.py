import os
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'  # папка для временных фото
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 🔐 Telegram настройки
TELEGRAM_BOT_TOKEN = "8157630049:AAEXE8sU-Nr9I0l6FDLZxBj98NZ93kGDsMw"
TELEGRAM_CHAT_ID = "1423772931"



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
    return render_template("photo_upload_1.html")  # страница с загрузкой фото

@app.route("/photo_upload_2/")
def photo_upload_page2():
    return render_template("photo_upload_2.html")  # страница с загрузкой фото

@app.route("/step1/")
def step1():
    return render_template("step1.html")  # Банка с землей


@app.route("/step2/")
def step2():
    return render_template("step2.html")  # Морозилка

@app.route("/step3/")
def step3():
    return render_template("step3.html")  # Вода

@app.route("/photo_upload_3/")
def photo_upload_page3():
    return render_template("photo_upload_3.html")  # страница с загрузкой фото

@app.route("/upload_photo", methods=["POST"])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({"success": False, "error": "No file part"})

    file = request.files['photo']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"})

    # Сохраняем временно
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    # Отправляем в Telegram
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    with open(filepath, 'rb') as photo:
        response = requests.post(url, data={
            'chat_id': TELEGRAM_CHAT_ID,
        }, files={
            'photo': photo
        })

    os.remove(filepath)  # очищаем после отправки

    if response.status_code == 200:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": response.text})

if __name__ == "__main__":
    app.run(debug=True)