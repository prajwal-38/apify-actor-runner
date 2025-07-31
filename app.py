from flask import Flask, render_template, request, jsonify
from apify_client import ApifyClient

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/test-token', methods=['POST'])
def test_token():
    data = request.get_json()

    token = (data or {}).get('api_token', '').strip()
    if not token:
        return jsonify({"success": False, "error": "API token is required."}), 400

    client = ApifyClient(token)
    result = client.test_connection()

    if result["success"]:
        return jsonify({"success": True, "message": "API token is valid."})

    return jsonify({"success": False, "error": result.get("error", "Unknown error")}), 401


@app.route('/api/actors', methods=['POST'])
def get_actors():
    data = request.get_json()
    token = data.get('api_token', '').strip()

    if not token:
        return jsonify({"success": False, "error": "API token is required."}), 400

    client = ApifyClient(token)
    result = client.list_actors()

    if result["success"]:
        return jsonify({"success": True, "actors": result["actors"]})

    return jsonify({"success": False, "error": result.get("error", "Unable to fetch actors.")}), 400


@app.route('/api/actor/<actor_id>/schema', methods=['POST'])
def get_actor_schema(actor_id):
    data = request.get_json()
    token = data.get('api_token', '').strip()

    if not token:
        return jsonify({"success": False, "error": "API token is required."}), 400

    client = ApifyClient(token)
    result = client.get_actor_details(actor_id)

    if not result["success"]:
        return jsonify({"success": False, "error": result.get("error", "Could not fetch actor details.")}), 400

    actor = result["actor"]
    schema = (
        actor.get("inputSchema")
        or actor.get("input")
        or actor.get("defaultRunOptions", {}).get("input")
    )

    # Fallback schema if nothing is provided
    if not schema or not schema.get("properties"):
        schema = {
            "type": "object",
            "properties": {
                "url": {"type": "string", "title": "URL"}
            },
            "required": ["url"]
        }

    return jsonify({
        "success": True,
        "schema": schema,
        "name": actor.get("name", "Unknown"),
        "description": actor.get("description", "")
    })


@app.route('/api/actor/<actor_id>/run', methods=['POST'])
def run_actor(actor_id):
    data = request.get_json()
    token = data.get('api_token', '').strip()

    if not token:
        return jsonify({"success": False, "error": "API token is required."}), 400

    input_data = data.get('input', {})
    client = ApifyClient(token)
    result = client.run_actor(actor_id, input_data)

    if not result["success"]:
        return jsonify({"success": False, "error": result.get("error", "Actor run failed.")}), 400

    run_data = result["run"]
    results = []

    dataset_id = run_data.get("defaultDatasetId")
    if dataset_id:
        dataset_result = client.get_run_dataset(dataset_id)
        if dataset_result["success"]:
            results = dataset_result["items"]

    return jsonify({
        "success": True,
        "run": run_data,
        "results": results
    })


if __name__ == '__main__':
    app.run(debug=True)
