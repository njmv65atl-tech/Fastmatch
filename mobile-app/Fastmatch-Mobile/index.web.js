import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Error handling for web
window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.backgroundColor = 'white';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerText = `Error: ${message} at ${source}:${lineno}:${colno}`;
    document.body.appendChild(errorDiv);
};

console.log('Registering Component:', appName);
AppRegistry.registerComponent(appName, () => App);

const root = document.getElementById('root');
if (root) {
    console.log('Running Application...');
    try {
        AppRegistry.runApplication(appName, {
            initialProps: {},
            rootTag: root,
        });
    } catch (e) {
        console.error('Failed to run application:', e);
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.innerText = `Runtime Error: ${e.message}`;
        document.body.appendChild(errorDiv);
    }
} else {
    console.error('Root element not found!');
}
