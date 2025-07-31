import requests

class ApifyClient:
    def __init__(self, api_token):
        self.token = api_token.strip()
        self.base_url = "https://api.apify.com/v2"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    # Check if the provided API token is valid
    def test_connection(self):
        try:
            response = requests.get(f"{self.base_url}/users/me", headers=self.headers, timeout=10)
            if response.status_code == 200:
                return {"success": True}
            return {
                "success": False,
                "error": f"Unexpected status code: {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # Fetch the user's actors
    def list_actors(self):
        try:
            response = requests.get(f"{self.base_url}/acts", headers=self.headers, timeout=10)
            if response.status_code == 200:
                actors = response.json().get("data", {}).get("items", [])
                return {"success": True, "actors": actors}
            return {
                "success": False,
                "error": f"Unexpected status code: {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # Fetch details and latest schema for a specific actor
    def get_actor_details(self, actor_id):
        try:
            response = requests.get(
                f"{self.base_url}/acts/{actor_id}", headers=self.headers, timeout=10
            )

            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Failed to get actor details (status {response.status_code})"
                }

            actor_data = response.json().get("data", {})

            # Attempt to fetch input schema for the latest actor version
            try:
                schema_response = requests.get(
                    f"{self.base_url}/acts/{actor_id}/versions/latest",
                    headers=self.headers, timeout=10
                )

                if schema_response.status_code == 200:
                    schema = schema_response.json().get("data", {}).get("inputSchema")
                    if schema:
                        actor_data["inputSchema"] = schema
            except Exception as schema_error:
                # errors are passed silently for now
                pass

            return {"success": True, "actor": actor_data}

        except Exception as e:
            return {"success": False, "error": str(e)}

    # Start an actor run with input data and wait for it to finish
    def run_actor(self, actor_id, input_data):
        try:
            response = requests.post(
                f"{self.base_url}/acts/{actor_id}/runs",
                headers=self.headers,
                json=input_data,
                params={"waitForFinish": 120},
                timeout=130
            )

            if response.status_code == 201:
                run_data = response.json().get("data", {})
                return {"success": True, "run": run_data}

            return {
                "success": False,
                "error": f"Run failed (HTTP {response.status_code}): {response.text}"
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # Retrieve the dataset items from a run
    def get_run_dataset(self, dataset_id):
        try:
            response = requests.get(
                f"{self.base_url}/datasets/{dataset_id}/items",
                headers=self.headers,
                timeout=10
            )

            if response.status_code == 200:
                items = response.json()
                return {"success": True, "items": items}

            return {
                "success": False,
                "error": f"Failed to fetch dataset (HTTP {response.status_code})"
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
