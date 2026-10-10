<?php

namespace App\Services;

use App\Models\SystemSetting;

class DocumentNumberService
{
    /**
     * Get the configured settings for unified document numbering and loan contract numbering.
     */
    public static function getSettings(): array
    {
        $currentFiscalYear = SystemSetting::get('current_fiscal_year', (string)(date('Y') + 543));
        $prefix = SystemSetting::get('doc_unified_prefix', 'ผง.');
        $format = SystemSetting::get('doc_unified_format', '{PREFIX} {NUMBER}/{YEAR}');
        $digits = (int) SystemSetting::get('doc_unified_digits', 3);
        $currentNo = (int) SystemSetting::get('doc_unified_current_no', 1);

        $loanPrefix = SystemSetting::get('doc_loan_prefix', 'สย.');
        $loanFormat = SystemSetting::get('doc_loan_format', '{PREFIX} {NUMBER}/{YEAR}');
        $loanDigits = (int) SystemSetting::get('doc_loan_digits', 3);
        $loanCurrentNo = (int) SystemSetting::get('doc_loan_current_no', 1);

        return [
            // Unified / Procurement settings
            'prefix' => $prefix,
            'format' => $format,
            'digits' => $digits > 0 ? $digits : 3,
            'current_no' => $currentNo > 0 ? $currentNo : 1,
            'fiscal_year' => $currentFiscalYear,

            // Loan Contract settings
            'loan_prefix' => $loanPrefix,
            'loan_format' => $loanFormat,
            'loan_digits' => $loanDigits > 0 ? $loanDigits : 3,
            'loan_current_no' => $loanCurrentNo > 0 ? $loanCurrentNo : 1,
        ];
    }

    /**
     * Format a document number based on pattern, prefix, number and year.
     */
    public static function formatNumber(string $format, string $prefix, int $number, int $digits, string $year): string
    {
        $paddedNumber = str_pad((string)$number, $digits, '0', STR_PAD_LEFT);
        $yearInt = (int)$year;
        $shortYear = $yearInt > 0 ? str_pad((string)($yearInt % 100), 2, '0', STR_PAD_LEFT) : substr($year, -2);
        
        $replacements = [
            '{PREFIX}' => trim($prefix),
            '{NUMBER}' => $paddedNumber,
            '{YEAR}' => trim($year),
            '{YEAR_SHORT}' => $shortYear,
        ];

        return trim(str_replace(array_keys($replacements), array_values($replacements), $format));
    }

    /**
     * Preview the next document number without incrementing the counter.
     */
    public static function previewNext(string $type = 'unified'): string
    {
        $settings = self::getSettings();
        if ($type === 'loan') {
            return self::formatNumber(
                $settings['loan_format'],
                $settings['loan_prefix'],
                $settings['loan_current_no'],
                $settings['loan_digits'],
                $settings['fiscal_year']
            );
        }

        return self::formatNumber(
            $settings['format'],
            $settings['prefix'],
            $settings['current_no'],
            $settings['digits'],
            $settings['fiscal_year']
        );
    }

    /**
     * Preview the next loan document number.
     */
    public static function previewNextLoan(): string
    {
        return self::previewNext('loan');
    }

    /**
     * Generate the next document number and automatically increment the counter.
     */
    public static function generateAndIncrement(string $type = 'unified'): string
    {
        $settings = self::getSettings();
        if ($type === 'loan') {
            $formatted = self::formatNumber(
                $settings['loan_format'],
                $settings['loan_prefix'],
                $settings['loan_current_no'],
                $settings['loan_digits'],
                $settings['fiscal_year']
            );

            // Increment sequence for loan
            SystemSetting::set('doc_loan_current_no', $settings['loan_current_no'] + 1, 'numbering', 'ลำดับเลขที่สัญญายืมเงินแผนงานปัจจุบัน', 'number');

            return $formatted;
        }

        $formatted = self::formatNumber(
            $settings['format'],
            $settings['prefix'],
            $settings['current_no'],
            $settings['digits'],
            $settings['fiscal_year']
        );

        // Increment sequence for procurement
        SystemSetting::set('doc_unified_current_no', $settings['current_no'] + 1, 'numbering', 'ลำดับเลขที่เอกสารแผนงานปัจจุบัน', 'number');

        return $formatted;
    }

    /**
     * Generate and increment loan document number.
     */
    public static function generateAndIncrementLoan(): string
    {
        return self::generateAndIncrement('loan');
    }

    /**
     * Update document numbering settings.
     */
    public static function updateSettings(array $data): array
    {
        // Procurement / Unified
        if (isset($data['prefix'])) {
            SystemSetting::set('doc_unified_prefix', trim($data['prefix']), 'numbering', 'คำนำหน้าเลขคุมเอกสารแผนงาน (ชุดจัดซื้อจัดจ้าง)', 'text');
        }
        if (isset($data['format'])) {
            SystemSetting::set('doc_unified_format', trim($data['format']), 'numbering', 'รูปแบบเลขคุมเอกสารแผนงาน (ชุดจัดซื้อจัดจ้าง)', 'text');
        }
        if (isset($data['digits'])) {
            SystemSetting::set('doc_unified_digits', max(1, (int)$data['digits']), 'numbering', 'จำนวนหลักตัวเลขคุมเอกสารจัดซื้อจัดจ้าง', 'number');
        }
        if (isset($data['current_no'])) {
            SystemSetting::set('doc_unified_current_no', max(1, (int)$data['current_no']), 'numbering', 'ลำดับเลขที่เอกสารจัดซื้อจัดจ้างปัจจุบัน', 'number');
        }

        // Loan Contract
        if (isset($data['loan_prefix'])) {
            SystemSetting::set('doc_loan_prefix', trim($data['loan_prefix']), 'numbering', 'คำนำหน้าเลขคุมสัญญายืมเงิน', 'text');
        }
        if (isset($data['loan_format'])) {
            SystemSetting::set('doc_loan_format', trim($data['loan_format']), 'numbering', 'รูปแบบเลขคุมสัญญายืมเงิน', 'text');
        }
        if (isset($data['loan_digits'])) {
            SystemSetting::set('doc_loan_digits', max(1, (int)$data['loan_digits']), 'numbering', 'จำนวนหลักตัวเลขคุมสัญญายืมเงิน', 'number');
        }
        if (isset($data['loan_current_no'])) {
            SystemSetting::set('doc_loan_current_no', max(1, (int)$data['loan_current_no']), 'numbering', 'ลำดับเลขที่สัญญายืมเงินปัจจุบัน', 'number');
        }

        return self::getSettings();
    }
}
