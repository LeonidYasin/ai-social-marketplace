// Test frontend-backend connection on Render
const testBackendConnection = async () => {
    console.log('🔍 Testing backend connection...');
    
    try {
        // Test backend health
        const healthResponse = await fetch('https://social-marketplace-api.onrender.com/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Backend Health:', healthData);
        
        // Test syslog
        const syslogResponse = await fetch('https://social-marketplace-api.onrender.com/api/syslog/logs');
        const syslogData = await syslogResponse.json();
        console.log('✅ Syslog API:', syslogData);
        
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
                console.error('❌ WebSocket Error:', error);
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
        const response = await fetch('https://social-marketplace-api.onrender.com/api/health');
        const data = await response.json();
        
        console.log('✅ Integration Test: Frontend can reach backend');
        console.log('📍 Backend response:', data);
        
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
    
    console.log('📊 Test Results:');
    console.log(`  Backend: ${backendOk ? '✅' : '❌'}`);
    console.log(`  WebSocket: ${websocketOk ? '✅' : '❌'}`);
    console.log(`  Integration: ${integrationOk ? '✅' : '❌'}`);
    
    if (backendOk && websocketOk && integrationOk) {
        console.log('🎉 All tests passed! Frontend can connect to backend on Render.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above.');
    }
};

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testBackendConnection, testWebSocketConnection, testFrontendBackendIntegration };
}

// Run if in browser
if (typeof window !== 'undefined') {
    runAllTests();
} 