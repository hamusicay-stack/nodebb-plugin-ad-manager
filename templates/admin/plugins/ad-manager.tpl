<div id="ad-manager-acp" class="acp-page-container pt-3 w-100">
	<!-- Page Header & Action Bar -->
	<div class="card mb-4 shadow-sm">
		<div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
			<div>
				<h3 class="fw-bold mb-1">
					<i class="fa fa-bullhorn text-primary me-2"></i>Ad Manager
				</h3>
				<p class="text-muted mb-0">ניהול יחידות פרסום, הגדרת סלקטורים להזרקה ומעקב אחר קליקים.</p>
			</div>
			<div class="d-flex gap-2">
				<button type="button" class="btn btn-success btn-add-ad">
					<i class="fa fa-plus me-1"></i> הוסף יחידת פרסום
				</button>
				<button type="button" id="btn-save-ads" class="btn btn-primary">
					<i class="fa fa-save me-1"></i> שמור שינויים
				</button>
			</div>
		</div>
	</div>

	<!-- Ad Units Table Card -->
	<div class="card shadow-sm w-100">
		<div class="card-header bg-light">
			<h5 class="card-title mb-0">יחידות פרסום מוגדרות</h5>
		</div>
		<div class="card-body p-0">
			<div class="table-responsive">
				<table class="table table-hover table-striped mb-0 align-middle w-100" style="min-width: 1000px;">
					<thead class="table-dark">
						<tr>
							<th style="width: 50px;" class="text-center">פעיל</th>
							<th style="min-width: 140px;">שם יחידה</th>
							<th style="min-width: 220px;">מיקום בפורום</th>
							<th style="min-width: 260px;">קישור לתמונה (JPG, PNG, GIF)</th>
							<th style="min-width: 220px;">קישור יעד (URL)</th>
							<th style="min-width: 140px;">תאריך תפוגה</th>
							<th style="min-width: 120px;">קוד HTML</th>
							<th style="width: 70px;" class="text-center">קליקים</th>
							<th style="width: 60px;" class="text-center">פעולות</th>
						</tr>
					</thead>
					<tbody id="ad-units-tbody"></tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<script id="ad-manager-saved-data" type="application/json">
{{{adsJson}}}
</script>

<script>
	require(['admin/plugins/ad-manager'], function (manager) {
		if (manager && typeof manager.init === 'function') {
			manager.init();
		}
	});
</script>






