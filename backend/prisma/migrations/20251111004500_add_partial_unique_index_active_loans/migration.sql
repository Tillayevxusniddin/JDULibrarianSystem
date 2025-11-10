-- CreateIndex
-- This partial unique index ensures only ONE active loan can exist per book copy
-- while allowing multiple historical (RETURNED/OVERDUE/PENDING_RETURN) loans
CREATE UNIQUE INDEX "loans_bookCopyId_active_unique" 
ON "loans"("bookCopyId") 
WHERE status = 'ACTIVE';
