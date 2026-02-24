$models = @(
    @{ name = 'MiniMax M2.1'; id = 'minimaxai/minimax-m2.1'; key = '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' },
    @{ name = 'Llama 3.1 8B'; id = 'meta/llama-3.1-8b-instruct'; key = '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' },
    @{ name = 'Llama 3.1 70B'; id = 'meta/llama-3.1-70b-instruct'; key = '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' },
    @{ name = 'DeepSeek v3.2'; id = 'deepseek-ai/deepseek-v3.2'; key = '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' },
    @{ name = 'Mistral Large 3'; id = 'mistralai/mistral-large-3-675b-instruct-2512'; key = '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' },
    @{ name = 'Kimi k2.5'; id = 'moonshotai/kimi-k2.5'; key = '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' },
    @{ name = 'Qwen 3 Next'; id = 'qwen/qwen3-next-80b-a3b-instruct'; key = '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' },
    @{ name = 'Llama 3.3 Super'; id = 'nvidia/llama-3.3-nemotron-super-49b-v1.5'; key = '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' }
)

Write-Host '🚀 Iniciando Test de Velocidad (NVIDIA NIM)...'

$results = @()

foreach ($m in $models) {
    $n = $m.name
    $k = $m.key
    $id = $m.id
    Write-Host "Testing $n..."
    $body = "{'model':'$id','messages':[{'role':'user','content':'Ready'}],'max_tokens':5}" -replace "'", '"'
    
    $start = Get-Date
    try {
        $headers = @{ Authorization = "Bearer $k" }
        $resp = Invoke-RestMethod -Uri 'https://integrate.api.nvidia.com/v1/chat/completions' -Method Post -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 10
        $end = Get-Date
        $diff = [Math]::Round(($end - $start).TotalMilliseconds, 0)
        Write-Host "$diff ms"
        $results += [PSCustomObject]@{ name = $n; duration = $diff }
    }
    catch {
        Write-Host 'Error'
        $results += [PSCustomObject]@{ name = $n; duration = 99999 }
    }
}

Write-Host '--- RANKING ---'
$results | Sort-Object duration | ForEach-Object { Write-Host "$($_.name) : $($_.duration) ms" }
