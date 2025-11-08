-- ============================================
-- 修正版：記事優先架構 - 任務表調整
-- ============================================

-- ============================================
-- 任務表 (Tasks) - 純粹的記事容器
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
    
    -- 基本資訊
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- ❌ 移除 timestamp 和 end_timestamp
    -- ✅ 時間資訊來自任務內的記事
    
    -- 可選：截止日期（用於提醒和排序，但不是「時間戳」）
    due_date DATE, -- 注意：是 DATE 不是 TIMESTAMP
    
    -- 任務狀態
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
    completed_at TIMESTAMP,
    
    -- 進度計算（由系統自動更新）
    total_entries INTEGER DEFAULT 0,
    completed_entries INTEGER DEFAULT 0,
    completion_percentage INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN total_entries = 0 THEN 0
            ELSE (completed_entries * 100 / total_entries)
        END
    ) STORED,
    
    -- 視覺
    color VARCHAR(7),
    icon VARCHAR(50),
    
    -- 排序位置（用戶可自定義任務順序）
    position INTEGER DEFAULT 0,
    
    -- 元資料
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_calendar ON tasks(calendar_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_position ON tasks(calendar_id, position);

-- ============================================
-- 視圖更新：任務及其記事的時間分布
-- ============================================

-- 任務詳細視圖（包含記事及其時間資訊）
CREATE VIEW tasks_with_entries_detailed AS
SELECT 
    t.id as task_id,
    t.title as task_title,
    t.description,
    t.status,
    t.due_date,
    t.completion_percentage,
    t.total_entries,
    t.completed_entries,
    t.color,
    
    -- 從記事中計算出的時間範圍
    MIN(e.timestamp) as earliest_entry_time,
    MAX(e.timestamp) as latest_entry_time,
    COUNT(CASE WHEN e.timestamp IS NOT NULL THEN 1 END) as scheduled_entries_count,
    
    -- 記事列表
    json_agg(
        json_build_object(
            'id', e.id,
            'title', e.title,
            'entry_type', e.entry_type,
            'is_completed', e.is_completed,
            'timestamp', e.timestamp,  -- ✅ 時間來自記事
            'position', e.position_in_task,
            'priority', e.priority
        ) ORDER BY e.position_in_task
    ) FILTER (WHERE e.id IS NOT NULL) as entries
FROM tasks t
LEFT JOIN entries e ON t.id = e.task_id
GROUP BY t.id;

-- ============================================
-- 輔助函數：取得任務的時間範圍
-- ============================================
CREATE OR REPLACE FUNCTION get_task_time_range(task_uuid UUID)
RETURNS TABLE (
    earliest TIMESTAMP,
    latest TIMESTAMP,
    has_scheduled_entries BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        MIN(timestamp) as earliest,
        MAX(timestamp) as latest,
        COUNT(timestamp) > 0 as has_scheduled_entries
    FROM entries
    WHERE task_id = task_uuid
      AND timestamp IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 使用範例查詢
-- ============================================

-- 1. 取得某個任務的所有記事及其時間
COMMENT ON VIEW tasks_with_entries_detailed IS '
範例查詢：
SELECT * FROM tasks_with_entries_detailed WHERE task_id = ''xxx'';

回傳：
{
  task_title: "準備產品發表會",
  earliest_entry_time: "2024-03-10 10:00",  -- 最早的記事時間
  latest_entry_time: "2024-03-15 14:00",    -- 最晚的記事時間
  entries: [
    { title: "訂場地", timestamp: "2024-03-10 10:00" },
    { title: "準備簡報", timestamp: "2024-03-12 09:00" },
    { title: "測試設備", timestamp: null },
    { title: "發表會", timestamp: "2024-03-15 14:00" }
  ]
}
';

-- 2. 取得即將到期的任務（基於 due_date）
COMMENT ON COLUMN tasks.due_date IS '
用途：
- 用於任務列表的排序
- 用於「即將到期」的提醒
- 不會顯示在日曆視圖中（日曆顯示的是記事的 timestamp）

範例查詢：
SELECT * FROM tasks 
WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL ''7 days''
  AND status = ''active''
ORDER BY due_date;
';

-- 3. 日曆視圖中顯示記事，不顯示任務
COMMENT ON VIEW calendar_view IS '
日曆視圖只顯示記事，即使記事屬於某個任務。
任務資訊作為上下文顯示（如顏色、標籤）。

範例：
3/15 的日曆格子中顯示：
- "客戶提案會議" (記事)
  [屬於任務「Q1專案」] ← 顯示為次要資訊
';
