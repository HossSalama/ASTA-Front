import { BrowserRouter } from 'react-router-dom'
import Theme from '@/components/template/Theme'
import { AuthProvider } from '@/auth'
import Views from '@/views'
import appConfig from './configs/app.config'

if (appConfig.enableMock) {
    import('./mock')
}

function App() {
    return (
        <Theme>
            <BrowserRouter>
                <AuthProvider>
                    <Views />
                </AuthProvider>
            </BrowserRouter>
        </Theme>
    )
}

export default App
