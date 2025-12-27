/**
 * Import/Export utilities for API Testing
 */

// Download data as JSON file
export function downloadJSON(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// Read JSON file
export function readJSONFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string)
                resolve(data)
            } catch (error) {
                reject(new Error('Invalid JSON file'))
            }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
    })
}

// Convert request to cURL command
export function toCurl(request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: string
}): string {
    let curl = `curl -X ${request.method} "${request.url}"`

    if (request.headers) {
        Object.entries(request.headers).forEach(([key, value]) => {
            curl += ` \\\n  -H "${key}: ${value}"`
        })
    }

    if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        curl += ` \\\n  -d '${request.body}'`
    }

    return curl
}

// Convert request to fetch code
export function toFetch(request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: string
}): string {
    const options: any = {
        method: request.method,
    }

    if (request.headers && Object.keys(request.headers).length > 0) {
        options.headers = request.headers
    }

    if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        options.body = request.body
    }

    return `fetch("${request.url}", ${JSON.stringify(options, null, 2)})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error))`
}

// Convert request to axios code
export function toAxios(request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: string
}): string {
    const config: any = {
        method: request.method.toLowerCase(),
        url: request.url
    }

    if (request.headers && Object.keys(request.headers).length > 0) {
        config.headers = request.headers
    }

    if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
            config.data = JSON.parse(request.body)
        } catch {
            config.data = request.body
        }
    }

    return `axios(${JSON.stringify(config, null, 2)})\n  .then(response => console.log(response.data))\n  .catch(error => console.error(error))`
}

// Import Postman collection
export function importPostmanCollection(collection: any) {
    const requests: any[] = []

    function processItem(item: any, folder: string = '') {
        if (item.request) {
            requests.push({
                id: Date.now().toString() + Math.random(),
                name: item.name || 'Unnamed Request',
                method: item.request.method || 'GET',
                url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
                headers: item.request.header?.reduce((acc: any, h: any) => {
                    acc[h.key] = h.value
                    return acc
                }, {}) || {},
                queryParams: {},
                body: item.request.body?.raw || '',
                validations: [],
                folder
            })
        }

        if (item.item && Array.isArray(item.item)) {
            item.item.forEach((subItem: any) => processItem(subItem, item.name || folder))
        }
    }

    if (collection.item && Array.isArray(collection.item)) {
        collection.item.forEach((item: any) => processItem(item))
    }

    return requests
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (error) {
        console.error('Failed to copy:', error)
        return false
    }
}

// Generate unique ID
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
