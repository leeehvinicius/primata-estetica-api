import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Content Security Policy (CSP)
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "media-src 'self'; " +
            "object-src 'none'; " +
            "child-src 'none'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self';"
        );

        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options
        res.setHeader('X-Frame-Options', 'DENY');

        // X-XSS-Protection
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy
        res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
        );

        // Strict Transport Security (HTTPS)
        if (req.secure || req.get('x-forwarded-proto') === 'https') {
            res.setHeader(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Remove headers que expõem informações do servidor
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        // Cross-Origin Resource Sharing (CORS) Security
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

        // Cache Control para endpoints sensíveis
        if (this.isSensitiveEndpoint(req.path)) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }

        // Feature Policy adicional
        res.setHeader(
            'Feature-Policy',
            "camera 'none'; microphone 'none'; payment 'none'; geolocation 'none'"
        );

        next();
    }

    private isSensitiveEndpoint(path: string): boolean {
        const sensitivePatterns = [
            '/auth',
            '/users',
            '/security',
            '/admin',
            '/reports',
            '/payments',
            '/clients',
            '/medical',
            '/audit'
        ];

        return sensitivePatterns.some(pattern => path.includes(pattern));
    }
}
