<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $host = request()->getHost() ?: (request()->header('Host') ?: 'service.npc.ac.th');

        // Force HTTPS scheme when behind SSL reverse proxy / production server or domain npc.ac.th
        $isHttps = config('app.env') === 'production' 
            || str_contains(request()->header('X-Forwarded-Proto', ''), 'https') 
            || str_contains(request()->header('X-Forwarded-Ssl', ''), 'on')
            || str_contains(request()->server('HTTP_X_FORWARDED_PROTO', ''), 'https')
            || request()->server('HTTPS') === 'on'
            || str_contains($host, 'npc.ac.th')
            || request()->secure();

        if ($isHttps) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Dynamically resolve base subpath (e.g. /npc_smartflow) from request or APP_URL
        $requestUri = request()->getRequestUri() ?? '';
        $subfolder = '';
        if (str_contains($requestUri, '/npc_smartflow')) {
            $subfolder = '/npc_smartflow';
        } elseif (request()->getBaseUrl()) {
            $subfolder = request()->getBaseUrl();
        }

        if ($subfolder) {
            $scheme = $isHttps ? 'https' : (request()->getScheme() ?: 'http');
            $rootUrl = "{$scheme}://{$host}{$subfolder}";
            \Illuminate\Support\Facades\URL::forceRootUrl($rootUrl);
            config(['app.asset_url' => $rootUrl]);
        } elseif ($appUrl = config('app.url')) {
            if ($appUrl !== 'http://localhost') {
                \Illuminate\Support\Facades\URL::forceRootUrl($appUrl);
                config(['app.asset_url' => $appUrl]);
            }
        }

        // Register Keycloak Socialite Provider
        \Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event) {
            $event->extendSocialite('keycloak', \SocialiteProviders\Keycloak\Provider::class);
        });
    }
}
