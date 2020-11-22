from flask import Flask
server = Flask(__name__)

@server.route('/images')
def hello():
    return 'Processing images...'

if __name__ == "__main__":
   server.run(host='0.0.0.0')