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
					<tbody id="ad-units-tbody">
						{{{each ads}}}
						<tr class="ad-unit-row" data-id="{ads.id}">
							<td class="text-center align-middle">
								<div class="form-check form-switch d-flex justify-content-center">
									<input type="checkbox" class="form-check-input ad-active" title="סטטוס פעיל" {{{if ads.active}}}checked{{{end}}}>
								</div>
							</td>
							<td>
								<input type="text" class="form-control form-control-sm ad-name mb-1" placeholder="שם היחידה" value="{ads.name}">
								<select class="form-select form-select-sm ad-page-target mb-1" title="תצוגה בדפים">
									<option value="all">🌐 כל הדפים</option>
									<option value="home">🏠 דף הבית בלבד</option>
									<option value="recent">🔥 נושאים אחרונים בלבד</option>
									<option value="topic">💬 דפי דיונים בלבד</option>
									<option value="category">📁 דפי קטגוריות בלבד</option>
									<option value="custom_path">🔗 נתיב מותאם אישית</option>
								</select>
								<div class="ad-page-path-wrapper mb-1" style="display: none;">
									<input type="text" class="form-control ad-page-path form-control-sm" placeholder="למשל: /topic/*" value="{ads.pagePath}">
								</div>
								<select class="form-select form-select-sm ad-device-target mb-1" title="תצוגה במכשירים">
									<option value="all">💻📱 כל המכשירים</option>
									<option value="desktop">💻 מחשב בלבד</option>
									<option value="mobile">📱 מובייל בלבד</option>
								</select>
								<div class="input-group input-group-sm mt-1" title="זמן רוטציה בשניות אם יש כמה מודעות באותו מיקום">
									<span class="input-group-text">🔄</span>
									<input type="number" min="2" max="120" class="form-control ad-rotate-interval" value="{ads.rotateInterval}">
									<span class="input-group-text">שניות</span>
								</div>
							</td>



							<td>
								<select class="form-select form-select-sm ad-location mb-1">
									<option value="top">באנר עליון (לרוחב)</option>
									<option value="bottom">באנר תחתון (לרוחב)</option>
									<option value="sidebar-right">סרגל צד ימין (לאורך)</option>
									<option value="sidebar-left">סרגל צד שמאל (לאורך)</option>
									<option value="recent-feed">פיד נושאים אחרונים (/recent)</option>
									<option value="custom">סלקטור מותאם אישית</option>
								</select>
								<div class="ad-selector-wrapper" style="display: none;">
									<input type="text" class="form-control ad-selector form-control-sm" placeholder="סלקטור, למשל: #content" value="{ads.selector}">
								</div>
								<div class="ad-repeat-wrapper mt-1" style="display: none;">
									<div class="input-group input-group-sm">
										<span class="input-group-text">כל</span>
										<input type="number" min="1" max="50" class="form-control ad-repeat-every" value="{ads.repeatEvery}">
										<span class="input-group-text">נושאים</span>
									</div>
								</div>
							</td>
							<td>
								<input type="text" class="form-control form-control-sm ad-image mb-1" placeholder="קישור לתמונה (JPG, PNG, GIF, WEBP)" value="{ads.image}">
								<div class="text-center">
									<img src="{ads.image}" class="ad-preview-img img-thumbnail" style="max-height: 40px; max-width: 120px; display: inline-block; margin: 0 auto;" alt="תצוגה מקדימה">
								</div>
							</td>
							<td>
								<input type="text" class="form-control form-control-sm ad-link" placeholder="https://example.com/target-page" value="{ads.link}">
							</td>
							<td>
								<input type="date" class="form-control form-control-sm ad-end-date" value="{ads.endDate}" title="תאריך סיום מוצג">
							</td>
							<td>
								<textarea class="form-control form-control-sm ad-html" rows="1" placeholder="קוד HTML חלופי">{ads.html}</textarea>
							</td>
							<td class="text-center align-middle">
								<span class="badge bg-info text-dark ad-clicks">{ads.clicks}</span>
							</td>
							<td class="text-center align-middle">
								<button type="button" class="btn btn-sm btn-danger btn-delete-ad" title="מחק">
									<i class="fa fa-trash"></i>
								</button>
							</td>
						</tr>
						{{{end}}}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<script>
	require(['admin/plugins/ad-manager'], function (manager) {
		if (manager && typeof manager.init === 'function') {
			manager.init();
		}
	});
</script>



