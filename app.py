from flask import Flask, render_template

app = Flask(__name__)

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

@app.route("/assoc2/")
def associative2():
    return render_template("associative2.html")

@app.route("/assoc3/")
def associative3():
    return render_template("associative3.html")

if __name__ == "__main__":
    app.run(debug=True)
