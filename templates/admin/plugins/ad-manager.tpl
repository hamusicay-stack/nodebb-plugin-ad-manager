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
							<th style="width: 20%;">שם יחידה</th>
							<th style="width: 25%;">CSS Selector להזרקה</th>
							<th style="width: 35%;">קוד HTML של המודעה</th>
							<th style="width: 10%;" class="text-center">קליקים</th>
							<th style="width: 10%;" class="text-center">פעולות</th>
						</tr>
					</thead>
					<tbody id="ad-units-tbody">
						{{{each ads}}}
						<tr class="ad-unit-row" data-id="{ads.id}">
							<td>
								<input type="text" class="form-control ad-name" placeholder="למשל: Header Banner" value="{ads.name}">
							</td>
							<td>
								<input type="text" class="form-control ad-selector" placeholder="למשל: #content" value="{ads.selector}">
							</td>
							<td>
								<textarea class="form-control ad-html" rows="2" placeholder="<div class='my-ad'>קוד פרסומת</div>">{ads.html}</textarea>
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

