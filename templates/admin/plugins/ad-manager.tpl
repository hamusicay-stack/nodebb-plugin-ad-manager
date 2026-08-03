<div id="ad-manager-acp" class="acp-page-container pt-3">
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
	<div class="card shadow-sm">
		<div class="card-header bg-light">
			<h5 class="card-title mb-0">יחידות פרסום מוגדרות</h5>
		</div>
		<div class="card-body p-0">
			<div class="table-responsive">
				<table class="table table-hover table-striped mb-0 align-middle">
					<thead class="table-dark">
						<tr>
							<th style="width: 15%;">שם יחידה</th>
							<th style="width: 20%;">מיקום בפורום</th>
							<th style="width: 22%;">קישור לתמונה</th>
							<th style="width: 22%;">קישור יעד (URL)</th>
							<th style="width: 11%;">קוד HTML חלופי</th>
							<th style="width: 5%;" class="text-center">קליקים</th>
							<th style="width: 5%;" class="text-center">פעולות</th>
						</tr>
					</thead>
					<tbody id="ad-units-tbody">
						{{{each ads}}}
						<tr class="ad-unit-row" data-id="{ads.id}">
							<td>
								<input type="text" class="form-control ad-name" placeholder="שם היחידה" value="{ads.name}">
							</td>
							<td>
								<select class="form-select ad-location mb-1">
									<option value="top">באנר עליון (לרוחב)</option>
									<option value="bottom">באנר תחתון (לרוחב)</option>
									<option value="sidebar-right">סרגל צד ימין (לאורך)</option>
									<option value="sidebar-left">סרגל צד שמאל (לאורך)</option>
									<option value="custom">סלקטור מותאם אישית</option>
								</select>
								<div class="ad-selector-wrapper" style="display: none;">
									<input type="text" class="form-control ad-selector form-control-sm" placeholder="סלקטור, למשל: #content" value="{ads.selector}">
								</div>
							</td>
							<td>
								<input type="text" class="form-control ad-image" placeholder="https://example.com/banner.png" value="{ads.image}">
							</td>
							<td>
								<input type="text" class="form-control ad-link" placeholder="https://example.com/target-page" value="{ads.link}">
							</td>
							<td>
								<textarea class="form-control ad-html" rows="1" placeholder="קוד HTML חלופי">{ads.html}</textarea>
							</td>
							<td class="text-center">
								<span class="badge bg-info text-dark ad-clicks">{ads.clicks}</span>
							</td>
							<td class="text-center">
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


