print("Starting...") 
from flask import Flask 
from flask_cors import CORS 
app = Flask(__name__) 
CORS(app) 
@app.route('/health') 
def health(): return {"status": "ok"} 
app.run(port=5000) 
