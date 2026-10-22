import { mock } from '../MockAdapter'
import { signInUserData } from '../data/authData'

mock.onPost(`/Auth/login`).reply((config) => {
    const data = JSON.parse(config.data as string) as {
        identifier: string
        password: string
    }

    const { identifier, password } = data

    const user = signInUserData.find(
        (u) => (u.email === identifier || u.mobileNumber === identifier) && u.password === password,
    )

    if (user) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve([
                    200,
                    {
                        status: true,
                        message: 'Operation completed successfully.',
                        data: {
                            accessToken: 'mock_jwt_access_token',
                            refreshToken: 'mock_refresh_token_64chars_hex_value',
                            expiresIn: 60,
                            refreshTokenExpiration: '2026-09-01T06:18:31.1234567+00:00',
                            user: {
                                id: 'usr_mock_1',
                                firstName: 'Admin',
                                lastName: 'User',
                                email: user.email,
                                phoneNumber: user.mobileNumber || '+966501234567',
                                status: 4,
                                profileImageUrl: null,
                            },
                        },
                    },
                ])
            }, 500)
        })
    }

    return [
        200,
        {
            status: false,
            message: 'Invalid email or password. Please check your credentials and try again.',
            data: null,
        },
    ]
})

mock.onPost(`/Auth/register`).reply((config) => {
    const data = JSON.parse(config.data as string) as {
        email: string
        password: string
        firstName: string
        lastName: string
        phoneNumber: string
    }

    const { email } = data
    const emailUsed = signInUserData.some((u) => u.email === email)

    return new Promise(function (resolve) {
        setTimeout(function () {
            if (emailUsed) {
                resolve([
                    200,
                    {
                        status: false,
                        message: 'This email is already registered. You can log in with your existing account.',
                        data: null,
                    },
                ])
                return
            }

            resolve([
                200,
                {
                    status: true,
                    message: 'OTP has been sent to your email.',
                    data: null,
                },
            ])
        }, 500)
    })
})

mock.onPost(`/Auth/verify-email`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'Operation completed successfully.',
            data: {
                accessToken: 'mock_jwt_access_token',
                refreshToken: 'mock_refresh_token_rotated',
                expiresIn: 60,
                refreshTokenExpiration: '2026-09-01T06:18:31.1234567+00:00',
                user: {
                    id: 'usr_mock_1',
                    firstName: 'Ahmed',
                    lastName: 'Ali',
                    email: 'ahmed.ali@example.com',
                    phoneNumber: '+966501234567',
                    status: 4,
                    profileImageUrl: null,
                },
            },
        },
    ]
})

mock.onPost(`/Auth/resend-otp`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'A new verification code has been sent to your email.',
            data: null,
        },
    ]
})

mock.onPost(`/Auth/forgot-password`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'Password reset code has been sent to your email.',
            data: null,
        },
    ]
})

mock.onPost(`/Auth/verify-reset-code`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'Operation completed successfully.',
            data: {
                resetToken: 'a3f89e2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
            },
        },
    ]
})

mock.onPost(`/Auth/reset-password`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'Operation completed successfully.',
            data: {
                accessToken: 'mock_jwt_access_token',
                refreshToken: 'mock_refresh_token_rotated',
                expiresIn: 60,
                refreshTokenExpiration: '2026-09-01T06:30:00.0000000+00:00',
                user: {
                    id: 'usr_mock_1',
                    firstName: 'Ahmed',
                    lastName: 'Ali',
                    email: 'ahmed.ali@example.com',
                    phoneNumber: '+966501234567',
                    status: 4,
                    profileImageUrl: null,
                },
            },
        },
    ]
})

mock.onPost(`/Auth/refresh-token`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'Operation completed successfully.',
            data: {
                accessToken: 'mock_jwt_access_token_refreshed',
                refreshToken: 'mock_refresh_token_rotated_again',
                expiresIn: 60,
                refreshTokenExpiration: '2026-09-01T06:35:00.0000000+00:00',
                user: {
                    id: 'usr_mock_1',
                    firstName: 'Ahmed',
                    lastName: 'Ali',
                    email: 'ahmed.ali@example.com',
                    phoneNumber: '+966501234567',
                    status: 4,
                    profileImageUrl: null,
                },
            },
        },
    ]
})

mock.onPost(`/Auth/logout`).reply(() => {
    return [
        200,
        {
            status: true,
            message: 'Logged out successfully.',
            data: null,
        },
    ]
})
