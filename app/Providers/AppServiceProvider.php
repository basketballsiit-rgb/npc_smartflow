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

        // Force HTTPS scheme when behind SSL reverse proxy / production server
        $isHttps = config('app.env') === 'production' 
            || str_contains(request()->header('X-Forwarded-Proto', ''), 'https') 
            || str_contains(request()->header('X-Forwarded-Ssl', ''), 'on')
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
            $host = request()->getHost() ?: 'service.npc.ac.th';
            $rootUrl = "{$scheme}://{$host}{$subfolder}";
            \Illuminate\Support\Facades\URL::forceRootUrl($rootUrl);
            \Illuminate\Support\Facades\URL::forceAssetRoot($rootUrl);
        } elseif ($appUrl = config('app.url')) {
            if ($appUrl !== 'http://localhost') {
                \Illuminate\Support\Facades\URL::forceRootUrl($appUrl);
                \Illuminate\Support\Facades\URL::forceAssetRoot($appUrl);
            }
        }

        // Force asset root path if ASSET_URL is defined
        if ($assetUrl = config('app.asset_url')) {
            \Illuminate\Support\Facades\URL::forceAssetRoot($assetUrl);
        }

        // Register Keycloak Socialite Provider
        \Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event) {
            $event->extendSocialite('keycloak', \SocialiteProviders\Keycloak\Provider::class);
        });
    }
}
