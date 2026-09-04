<?php

namespace App\Services;

use App\Models\SystemSetting;

class DocumentNumberService
{
    /**
     * Get the configured settings for unified document numbering.
     */
    public static function getSettings(): array
    {
        $currentFiscalYear = SystemSetting::get('current_fiscal_year', (string)(date('Y') + 543));
        $prefix = SystemSetting::get('doc_unified_prefix', 'ผง.');
        $format = SystemSetting::get('doc_unified_format', '{PREFIX} {NUMBER}/{YEAR}');
        $digits = (int) SystemSetting::get('doc_unified_digits', 3);
        $currentNo = (int) SystemSetting::get('doc_unified_current_no', 1);

        return [
            'prefix' => $prefix,
            'format' => $format,
            'digits' => $digits > 0 ? $digits : 3,
            'current_no' => $currentNo > 0 ? $currentNo : 1,
            'fiscal_year' => $currentFiscalYear,
        ];
    }

    /**
     * Format a document number based on pattern, prefix, number and year.
     */
    public static function formatNumber(string $format, string $prefix, int $number, int $digits, string $year): string
    {
        $paddedNumber = str_pad((string)$number, $digits, '0', STR_PAD_LEFT);
        
        $replacements = [
            '{PREFIX}' => trim($prefix),
            '{NUMBER}' => $paddedNumber,
            '{YEAR}' => trim($year),
        ];

        return trim(str_replace(array_keys($replacements), array_values($replacements), $format));
    }

    /**
     * Preview the next document number without incrementing the counter.
     */
    public static function previewNext(): string
    {
        $settings = self::getSettings();
        return self::formatNumber(
            $settings['format'],
            $settings['prefix'],
            $settings['current_no'],
            $settings['digits'],
            $settings['fiscal_year']
        );
    }

    /**
     * Generate the next document number and automatically increment the counter.
     */
    public static function generateAndIncrement(): string
    {
        $settings = self::getSettings();
        $formatted = self::formatNumber(
            $settings['format'],
            $settings['prefix'],
            $settings['current_no'],
            $settings['digits'],
            $settings['fiscal_year']
        );

        // Increment sequence
        SystemSetting::set('doc_unified_current_no', $settings['current_no'] + 1, 'numbering', 'ลำดับเลขที่เอกสารแผนงานปัจจุบัน', 'number');

        return $formatted;
    }

    /**
     * Update document numbering settings.
     */
    public static function updateSettings(array $data): array
    {
        if (isset($data['prefix'])) {
            SystemSetting::set('doc_unified_prefix', trim($data['prefix']), 'numbering', 'คำนำหน้าเลขคุมเอกสารแผนงาน', 'text');
        }
        if (isset($data['format'])) {
            SystemSetting::set('doc_unified_format', trim($data['format']), 'numbering', 'รูปแบบเลขคุมเอกสารแผนงาน', 'text');
        }
        if (isset($data['digits'])) {
            SystemSetting::set('doc_unified_digits', max(1, (int)$data['digits']), 'numbering', 'จำนวนหลักตัวเลขคุมเอกสาร', 'number');
        }
        if (isset($data['current_no'])) {
            SystemSetting::set('doc_unified_current_no', max(1, (int)$data['current_no']), 'numbering', 'ลำดับเลขที่เอกสารแผนงานปัจจุบัน', 'number');
        }

        return self::getSettings();
    }
}
