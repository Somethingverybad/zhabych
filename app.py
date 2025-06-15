from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/zg1/")
def zagadka1():
     return render_template("zagadka1.html")
     
@app.route("/zg2/")
def zagadka1():
     return render_template("zagadka2.html")

@app.route("/zg3/")
def zagadka1():
     return render_template("zagadka3.html")

if __name__ == "__main__":
    app.run(debug=True)
