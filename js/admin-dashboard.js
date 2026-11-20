(() => {
  async function loadSalesOverview(supabase) {
    const { data, error } = await supabase.rpc('get_store_sales_overview');
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Sales overview returned invalid data.');
    return {
      paidCount: Number(data.paidCount) || 0,
      pendingCount: Number(data.pendingCount) || 0,
      cancelledCount: Number(data.cancelledCount) || 0,
      revenue: Number(data.revenue) || 0,
      topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
    };
  }

  window.KahLimaAdminDashboard = { loadSalesOverview };
})();
