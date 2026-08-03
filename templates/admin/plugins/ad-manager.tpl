<div id="ad-manager-acp" class="acp-page-container">
	<div class="row mb-4">
		<div class="col-12 d-flex justify-content-between align-items-center">
			<div>
				<h3 class="fw-bold mb-1">
					<i class="fa fa-bullhorn text-primary me-2"></i>Ad Manager
				</h3>
				<p class="text-muted mb-0">Manage ad units, set CSS injection targets, and view click statistics.</p>
			</div>
			<div>
				<button type="button" class="btn btn-success me-2 btn-add-ad">
					<i class="fa fa-plus me-1"></i> Add Ad Unit
				</button>
				<button type="button" id="btn-save-ads" class="btn btn-primary">
					<i class="fa fa-save me-1"></i> Save All Changes
				</button>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-12">
			<div class="card shadow-sm">
				<div class="card-header bg-light">
					<h5 class="card-title mb-0">Configured Ad Units</h5>
				</div>
				<div class="card-body p-0">
					<div class="table-responsive">
						<table class="table table-hover table-striped mb-0">
							<thead class="table-dark">
								<tr>
									<th style="width: 20%;">Unit Name</th>
									<th style="width: 25%;">CSS Selector</th>
									<th style="width: 35%;">Ad HTML Code</th>
									<th style="width: 10%;" class="text-center">Clicks</th>
									<th style="width: 10%;" class="text-center">Actions</th>
								</tr>
							</thead>
							<tbody id="ad-units-tbody">
								{{{each ads}}}
								<tr class="ad-unit-row" data-id="{ads.id}">
									<td>
										<input type="text" class="form-control ad-name" placeholder="e.g. Header Banner" value="{ads.name}">
									</td>
									<td>
										<input type="text" class="form-control ad-selector" placeholder="e.g. #content" value="{ads.selector}">
									</td>
									<td>
										<textarea class="form-control ad-html" rows="2" placeholder="<div class='my-ad'>Ad Code</div>">{ads.html}</textarea>
									</td>
									<td class="text-center align-middle">
										<span class="badge bg-info text-dark ad-clicks">{ads.clicks}</span>
									</td>
									<td class="text-center align-middle">
										<button type="button" class="btn btn-sm btn-danger btn-delete-ad" title="Delete">
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
	</div>
</div>
