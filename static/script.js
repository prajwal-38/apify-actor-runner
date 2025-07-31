let token = '';
let selectedActor = null;

// Show/hide the loading spinner
function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

// Navigate between steps
function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

// display a message in a status box
function showStatus(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `status ${isError ? 'error' : 'success'}`;
}

// API token authentcation
async function authenticate() {
    const inputField = document.getElementById('api-token');
    token = inputField.value.trim();

    if (!token) {
        showStatus('auth-status', 'Please enter your API token.', true);
        return;
    }

    showLoader();

    try {
        const response = await fetch('/api/test-token', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ api_token: token })
        });

        const data = await response.json();

        if (data.success) {
            showStatus('auth-status', 'Connected successfully!');
            setTimeout(loadActors, 1000);
        } else {
            showStatus('auth-status', data.error || 'Authentication failed.', true);
        }
    } catch (err) {
        console.error('Auth error:', err);
        showStatus('auth-status', 'Connection failed.', true);
    } finally {
        hideLoader();
    }
}

// display list of actors
async function loadActors() {
    showStep('actors-step');
    showLoader();

    try {
        const response = await fetch('/api/actors', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ api_token: token })
        });

        const data = await response.json();

        if (data.success) {
            displayActors(data.actors);
        } else {
            showStatus('actors-status', data.error || 'Unable to fetch actors.', true);
        }
    } catch (err) {
        console.error('Actor load error:', err);
        showStatus('actors-status', 'Failed to load actors.', true);
    } finally {
        hideLoader();
    }
}

// Render actor cards
function displayActors(actors) {
    const grid = document.getElementById('actors-grid');
    grid.innerHTML = '';

    actors.forEach(actorItem => {
        const card = document.createElement('div');
        card.className = 'actor-card';
        card.onclick = () => selectActor(actorItem);

        card.innerHTML = `
            <h3>${actorItem.name || 'Unnamed'}</h3>
            <p>${actorItem.description || 'No description provided.'}</p>
        `;

        grid.appendChild(card);
    });
}

// Actor was selected then load its config schema
function selectActor(actorItem) {
    selectedActor = actorItem;
    loadSchema(actorItem.id);
}

// Fetch schema for selected actor
async function loadSchema(actorId) {
    showStep('config-step');
    showLoader();

    document.getElementById('actor-name').textContent = selectedActor.name || 'Unnamed';
    document.getElementById('actor-desc').textContent = selectedActor.description || '';

    try {
        const response = await fetch(`/api/actor/${actorId}/schema`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ api_token: token })
        });

        const data = await response.json();

        if (data.success) {
            buildForm(data.schema);
        } else {
            showStatus('config-status', data.error || 'Schema fetch failed.', true);
        }
    } catch (err) {
        console.error('Schema load error:', err);
        showStatus('config-status', 'Failed to load schema.', true);
    } finally {
        hideLoader();
    }
}

// build input from schema
function buildForm(schema) {
    const container = document.getElementById('form-fields');
    container.innerHTML = '';

    const props = schema?.properties;

    if (!props || Object.keys(props).length === 0) {
        container.innerHTML = '<p>No configuration needed for this actor.</p>';
        return;
    }

    Object.entries(props).forEach(([key, field]) => {
        const group = document.createElement('div');
        group.className = 'field-group';

        const label = document.createElement('label');
        label.textContent = field.title || key;
        if (schema.required?.includes(key)) label.textContent += ' *';

        let input;

        // Handle different input types
        if (field.enum) {
            input = document.createElement('select');
            field.enum.forEach(optionValue => {
                const option = document.createElement('option');
                option.value = option.textContent = optionValue;
                input.appendChild(option);
            });
        } else if (field.type === 'boolean') {
            input = document.createElement('input');
            input.type = 'checkbox';
        } else if (field.type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }

        input.name = key;

        // Set default value if available
        if (field.default !== undefined) {
            if (field.type === 'boolean') {
                input.checked = field.default;
            } else {
                input.value = field.default;
            }
        }

        group.appendChild(label);
        group.appendChild(input);
        container.appendChild(group);
    });
}

// Submit configuration and run actor
async function execute() {
    if (!selectedActor) return;

    showLoader();

    const form = document.getElementById('config-form');
    const formData = new FormData(form);
    const input = {};

    for (let [key, value] of formData.entries()) {
        const field = form.querySelector(`[name="${key}"]`);

        if (field.type === 'checkbox') {
            input[key] = field.checked;
        } else if (field.type === 'number') {
            input[key] = parseFloat(value) || 0;
        } else {
            input[key] = value;
        }
    }

    try {
        const response = await fetch(`/api/actor/${selectedActor.id}/run`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ api_token: token, input })
        });

        const result = await response.json();

        if (result.success) {
            showResults(result.run, result.results);
        } else {
            showStatus('config-status', result.error || 'Execution failed.', true);
        }
    } catch (err) {
        console.error('Execution error:', err);
        showStatus('config-status', 'Execution failed.', true);
    } finally {
        hideLoader();
    }
}

// Display results
function showResults(run, results) {
    showStep('results-step');

    const status = document.getElementById('run-status');
    status.textContent = run.status;
    status.className = `run-status ${run.status === 'SUCCEEDED' ? 'success' : 'failed'}`;

    const content = document.getElementById('results-content');
    content.innerHTML = `<pre>${JSON.stringify(results || 'No data', null, 2)}</pre>`;
}

// Simple navigation helpers
function goBack() {
    showStep('actors-step');
}

function restart() {
    token = '';
    selectedActor = null;
    document.getElementById('api-token').value = '';
    showStep('auth-step');
}

// pressing Enter to submit the token
document.getElementById('api-token').addEventListener('keypress', event => {
    if (event.key === 'Enter') {
        authenticate();
    }
});
