interface User {
  id: number
  name: string
  email: string
  role_id: number | null
}

export function useAuth() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const user = useState<User | null>('auth:user', () => null)

  function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match?.[2] ? decodeURIComponent(match[2]) : null
  }

  async function getCsrfCookie() {
    await $fetch(`${apiBase}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
  }

  async function login(email: string, password: string) {
    await getCsrfCookie()

    const xsrfToken = getCookie('XSRF-TOKEN')

    await $fetch(`${apiBase}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': xsrfToken ?? '',
      },
      body: { email, password },
    })

    await fetchUser()
  }

  async function fetchUser() {
    user.value = await $fetch<User>(`${apiBase}/api/user`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
  }

  async function logout() {
    const xsrfToken = getCookie('XSRF-TOKEN')

    await $fetch(`${apiBase}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': xsrfToken ?? '',
      },
    })

    user.value = null
  }

  return { user, login, logout, fetchUser, getCsrfCookie }
}