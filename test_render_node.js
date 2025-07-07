const https = require('https');
const WebSocket = require('ws');

// Helper function to make HTTPS requests
const makeRequest = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
};

const testBackendConnection = async () => {
    console.log('🔍 Testing backend connection...');
    
    try {
        // Test backend health
        const healthResponse = await makeRequest('https://social-marketplace-api.onrender.com/api/health');
        console.log('✅ Backend Health:', healthResponse.data);
        
        // Test syslog
        const syslogResponse = await makeRequest('https://social-marketplace-api.onrender.com/api/syslog/logs');
        console.log('✅ Syslog API:', syslogResponse.data);
        
        return true;
    } catch (error) {
        console.error('❌ Backend Error:', error.message);
        return false;
    }
};

const testWebSocketConnection = () => {
    console.log('🔍 Testing WebSocket connection...');
    
    return new Promise((resolve) => {
        try {
            const socket = new WebSocket('wss://social-marketplace-api.onrender.com');
            
            socket.onopen = () => {
                console.log('✅ WebSocket: Connected successfully');
                socket.close();
                resolve(true);
            };
            
            socket.onerror = (error) => {
                console.error('❌ WebSocket Error:', error.message);
                resolve(false);
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (socket.readyState === WebSocket.CONNECTING) {
                    console.log('⏰ WebSocket: Connection timeout');
                    socket.close();
                    resolve(false);
                }
            }, 5000);
            
        } catch (error) {
            console.error('❌ WebSocket Error:', error.message);
            resolve(false);
        }
    });
};

const testFrontendBackendIntegration = async () => {
    console.log('🔍 Testing frontend-backend integration...');
    
    try {
        // Test if frontend can reach backend
        const response = await makeRequest('https://social-marketplace-api.onrender.com/api/health');
        
        console.log('✅ Integration Test: Frontend can reach backend');
        console.log('📍 Backend response:', response.data);
        
        return true;
    } catch (error) {
        console.error('❌ Integration Error:', error.message);
        return false;
    }
};

// Run all tests
const runAllTests = async () => {
    console.log('🚀 Starting Render connection tests...');
    
    const backendOk = await testBackendConnection();
    const websocketOk = await testWebSocketConnection();
    const integrationOk = await testFrontendBackendIntegration();
    
    console.log('\n📊 Test Results:');
    console.log(`  Backend: ${backendOk ? '✅' : '❌'}`);
    console.log(`  WebSocket: ${websocketOk ? '✅' : '❌'}`);
    console.log(`  Integration: ${integrationOk ? '✅' : '❌'}`);
    
    if (backendOk && websocketOk && integrationOk) {
        console.log('\n🎉 All tests passed! Frontend can connect to backend on Render.');
    } else {
        console.log('\n⚠️ Some tests failed. Check the logs above.');
    }
};

// Run tests
runAllTests(); 