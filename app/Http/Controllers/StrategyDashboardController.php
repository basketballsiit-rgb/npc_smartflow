<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Department;
use App\Models\StrategyCategory;
use App\Models\StrategyItem;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StrategyDashboardController extends Controller
{
    /**
     * Display the Strategic Alignment & Project Filtering Dashboard.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return redirect()->route('login');
        }

        $currentFiscalYear = SystemSetting::where('key', 'current_fiscal_year')->value('value') ?: (date('Y') + 543);

        $fiscalYear = $request->query('fiscal_year', $currentFiscalYear);
        $departmentId = $request->query('department_id', 'all');
        $categoryId = $request->query('category_id', 'all');
        $status = $request->query('status', 'all');
        $search = trim($request->query('search', ''));
        $coverage = $request->query('coverage', 'all'); // 'all', 'covered', 'uncovered'

        // 1. Fetch available fiscal years from existing projects & system setting
        $distinctYears = Project::whereNotNull('academic_year')
            ->distinct()
            ->pluck('academic_year')
            ->map(fn($y) => (string)$y)
            ->toArray();
        if (!in_array((string)$currentFiscalYear, $distinctYears)) {
            $distinctYears[] = (string)$currentFiscalYear;
        }
        rsort($distinctYears);

        // 2. Fetch departments
        $departments = Department::orderBy('name', 'asc')->get(['id', 'name', 'code']);

        // 3. Fetch active strategy categories with their active items
        $categoriesQuery = StrategyCategory::with(['items' => function ($q) {
            $q->where('is_active', true)->orderBy('order_index', 'asc')->orderBy('id', 'asc');
        }])->where('is_active', true)->orderBy('order_index', 'asc')->orderBy('id', 'asc');

        if ($categoryId && $categoryId !== 'all') {
            $categoriesQuery->where('id', $categoryId);
        }

        $categories = $categoriesQuery->get();

        // 4. Query projects with filters
        $projectQuery = Project::with(['department', 'user', 'budget.fundingSource', 'fundingSource']);

        if ($fiscalYear && $fiscalYear !== 'all') {
            $projectQuery->where('academic_year', $fiscalYear);
        }

        if ($departmentId && $departmentId !== 'all') {
            $projectQuery->where('department_id', $departmentId);
        }

        if ($status && $status !== 'all') {
            if ($status === 'approved') {
                $projectQuery->whereIn('status', ['approved', 'completed', 'budget_approved']);
            } elseif ($status === 'pending') {
                $projectQuery->whereIn('status', ['submitted', 'pending_approval', 'preliminary']);
            } else {
                $projectQuery->where('status', $status);
            }
        }

        if ($search !== '') {
            $projectQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('responsible_person', 'like', "%{$search}%")
                  ->orWhere('project_code', 'like', "%{$search}%");
            });
        }

        $allProjects = $projectQuery->latest()->get();

        // Pre-calculate project mapped items
        $projectMappedItems = [];
        foreach ($allProjects as $project) {
            $projectMappedItems[$project->id] = $this->resolveProjectItemIds($project);
        }

        // 5. Build enriched category and item dashboard data
        $enrichedCategories = [];
        $globalAllProjectIds = [];
        $globalCoveredItemIds = [];
        $globalTotalItemsCount = 0;
        $globalTotalBudget = 0;

        foreach ($categories as $cat) {
            $catProjectIds = [];
            $catBudgetSum = 0;
            $catItemsData = [];
            $catCoveredItemsCount = 0;

            foreach ($cat->items as $item) {
                $globalTotalItemsCount++;
                $matchedProjects = [];
                $itemBudgetSum = 0;
                $statusCounts = [
                    'approved' => 0,
                    'pending' => 0,
                    'draft' => 0,
                    'rejected' => 0,
                ];

                foreach ($allProjects as $project) {
                    $itemIds = $projectMappedItems[$project->id] ?? [];
                    if (in_array($item->id, $itemIds, true)) {
                        $budgetAmt = (float)(
                            ($project->budget && $project->budget->allocated_amount > 0)
                                ? $project->budget->allocated_amount
                                : ($project->estimated_budget > 0 ? $project->estimated_budget : $project->proposed_budget)
                        );

                        $matchedProjects[] = [
                            'id' => $project->id,
                            'title' => $project->title,
                            'project_code' => $project->project_code ?? ('PRJ-' . str_pad($project->id, 4, '0', STR_PAD_LEFT)),
                            'status' => $project->status,
                            'academic_year' => $project->academic_year,
                            'department_id' => $project->department_id,
                            'department_name' => $project->department?->name ?? 'ไม่ระบุฝ่าย',
                            'responsible_person' => $project->responsible_person ?: ($project->user?->name ?? 'ไม่ระบุ'),
                            'position' => $project->position,
                            'budget_amount' => $budgetAmt,
                            'funding_source' => $project->budget?->fundingSource?->name ?: ($project->fundingSource?->name ?: 'บกศ.'),
                            'updated_at' => $project->updated_at ? $project->updated_at->format('d/m/Y') : null,
                        ];

                        $catProjectIds[] = $project->id;
                        $globalAllProjectIds[] = $project->id;
                        $itemBudgetSum += $budgetAmt;

                        if (in_array($project->status, ['approved', 'completed', 'budget_approved'])) {
                            $statusCounts['approved']++;
                        } elseif (in_array($project->status, ['submitted', 'pending_approval', 'preliminary'])) {
                            $statusCounts['pending']++;
                        } elseif ($project->status === 'draft') {
                            $statusCounts['draft']++;
                        } else {
                            $statusCounts['rejected']++;
                        }
                    }
                }

                $hasProjects = count($matchedProjects) > 0;
                if ($hasProjects) {
                    $catCoveredItemsCount++;
                    $globalCoveredItemIds[] = $item->id;
                }

                // Check coverage filter per item
                if ($coverage === 'covered' && !$hasProjects) {
                    continue;
                }
                if ($coverage === 'uncovered' && $hasProjects) {
                    continue;
                }

                $catBudgetSum += $itemBudgetSum;

                $catItemsData[] = [
                    'id' => $item->id,
                    'group_name' => $item->group_name,
                    'name' => $item->name,
                    'code' => $item->code,
                    'description' => $item->description,
                    'order_index' => $item->order_index,
                    'projects_count' => count($matchedProjects),
                    'total_budget' => $itemBudgetSum,
                    'status_counts' => $statusCounts,
                    'projects' => $matchedProjects,
                ];
            }

            $catUniqueProjectIds = array_unique($catProjectIds);
            $totalItemsInCat = $cat->items->count();

            $enrichedCategories[] = [
                'id' => $cat->id,
                'name' => $cat->name,
                'code' => $cat->code,
                'description' => $cat->description,
                'order_index' => $cat->order_index,
                'total_items_count' => $totalItemsInCat,
                'covered_items_count' => $catCoveredItemsCount,
                'uncovered_items_count' => max(0, $totalItemsInCat - $catCoveredItemsCount),
                'coverage_percentage' => $totalItemsInCat > 0 ? round(($catCoveredItemsCount / $totalItemsInCat) * 100) : 0,
                'unique_projects_count' => count($catUniqueProjectIds),
                'total_budget' => $catBudgetSum,
                'items' => $catItemsData,
            ];
        }

        $globalUniqueProjectCount = count(array_unique($globalAllProjectIds));
        $globalCoveredItemsCount = count(array_unique($globalCoveredItemIds));
        $globalUncoveredItemsCount = max(0, $globalTotalItemsCount - $globalCoveredItemsCount);
        $globalCoverageRate = $globalTotalItemsCount > 0 ? round(($globalCoveredItemsCount / $globalTotalItemsCount) * 100) : 0;

        // Sum of budget of all unique matched projects
        $matchedUniqueProjects = $allProjects->whereIn('id', array_unique($globalAllProjectIds));
        foreach ($matchedUniqueProjects as $p) {
            $amt = (float)(
                ($p->budget && $p->budget->allocated_amount > 0)
                    ? $p->budget->allocated_amount
                    : ($p->estimated_budget > 0 ? $p->estimated_budget : $p->proposed_budget)
            );
            $globalTotalBudget += $amt;
        }

        $stats = [
            'total_categories' => count($categories),
            'total_items' => $globalTotalItemsCount,
            'covered_items' => $globalCoveredItemsCount,
            'uncovered_items' => $globalUncoveredItemsCount,
            'coverage_rate' => $globalCoverageRate,
            'total_linked_projects' => $globalUniqueProjectCount,
            'total_projects_filtered' => $allProjects->count(),
            'total_budget' => $globalTotalBudget,
        ];

        return Inertia::render('Strategies/Dashboard', [
            'categories' => $enrichedCategories,
            'stats' => $stats,
            'fiscalYears' => $distinctYears,
            'departments' => $departments,
            'currentFiscalYear' => $currentFiscalYear,
            'canManageStrategies' => $user->isAdmin() || $user->isPlanHead(),
            'filters' => [
                'fiscal_year' => $fiscalYear,
                'department_id' => $departmentId,
                'category_id' => $categoryId,
                'status' => $status,
                'search' => $search,
                'coverage' => $coverage,
            ],
        ]);
    }

    /**
     * Helper to resolve all StrategyItem IDs mapped to a Project.
     */
    protected function resolveProjectItemIds(Project $project): array
    {
        $itemIds = [];

        // 1. Direct Dynamic strategy_selections JSON: {"1": [1, 2], "2": [6]}
        if (!empty($project->strategy_selections) && is_array($project->strategy_selections)) {
            foreach ($project->strategy_selections as $catId => $ids) {
                if (is_array($ids)) {
                    foreach ($ids as $id) {
                        if ($id) $itemIds[] = (int)$id;
                    }
                } elseif ($ids) {
                    $itemIds[] = (int)$ids;
                }
            }
        }

        // 2. Legacy IQA strategy IDs (items 1..5)
        $legacyIqa = $project->iqa_strategy_ids ?: ($project->iqa_strategy_id ? [$project->iqa_strategy_id] : []);
        if (is_array($legacyIqa)) {
            foreach ($legacyIqa as $id) {
                if ($id) $itemIds[] = (int)$id;
            }
        }

        // 3. Legacy OVEC strategy IDs (correspond to items 6..10)
        $legacyOvec = $project->ovec_strategy_ids ?: ($project->ovec_strategy_id ? [$project->ovec_strategy_id] : []);
        if (is_array($legacyOvec)) {
            foreach ($legacyOvec as $id) {
                if ($id >= 6 && $id <= 10) {
                    $itemIds[] = (int)$id;
                } elseif ($id >= 1 && $id <= 5) {
                    $itemIds[] = (int)$id + 5;
                }
            }
        }

        // 4. Legacy National strategy IDs (correspond to items 11..16)
        $legacyNat = $project->national_strategy_ids ?: [];
        if (is_array($legacyNat)) {
            foreach ($legacyNat as $id) {
                if ($id >= 11 && $id <= 16) {
                    $itemIds[] = (int)$id;
                } elseif ($id >= 1 && $id <= 6) {
                    $itemIds[] = (int)$id + 10;
                }
            }
        }

        // 5. Legacy Provincial strategy IDs (correspond to items 17..20)
        $legacyProv = $project->provincial_strategy_ids ?: [];
        if (is_array($legacyProv)) {
            foreach ($legacyProv as $id) {
                if ($id >= 17 && $id <= 20) {
                    $itemIds[] = (int)$id;
                } elseif ($id >= 1 && $id <= 4) {
                    $itemIds[] = (int)$id + 16;
                }
            }
        }

        return array_values(array_unique($itemIds));
    }
}
