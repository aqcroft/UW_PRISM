/* Pure PRISM activity and promotion helpers. The portal extract cannot prove
 * personal sponsorship or all UW qualification conditions; callers must label
 * promotion results as estimates and preserve these caveats in the UI. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PRISMIntelligence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function activityFor(partner, currentRows, previousRows) {
    const old = (previousRows || []).find(p => p.name === partner.name);
    const current = currentRows || [];
    const previousNames = new Set((previousRows || []).map(p => p.name));
    let directRecruitments = 0;
    const index = current.findIndex(p => p.name === partner.name);
    if (index >= 0) {
      for (let i = index + 1; i < current.length; i++) {
        const child = current[i];
        if (Number(child.level) <= Number(partner.level)) break;
        if (Number(child.level) === Number(partner.level) + 1 && !child.closed && !previousNames.has(child.name)) directRecruitments++;
      }
    }
    const pcDelta = old ? Number(partner.pc) - Number(old.pc) : null;
    const gcDelta = old ? Number(partner.gc) - Number(old.gc) : null;
    const serviceDelta = old ? Number(partner.services) - Number(old.services) : null;
    return {
      hasComparison: !!old,
      personalCustomerDelta: pcDelta,
      directRecruitments,
      groupCustomerDelta: gcDelta,
      serviceDelta,
      personallyActive: (pcDelta != null && pcDelta > 0) || directRecruitments > 0,
      structuralChangeOnly: !((pcDelta != null && pcDelta > 0) || directRecruitments > 0) && ((gcDelta || 0) !== 0 || (serviceDelta || 0) !== 0)
    };
  }

  function evaluatePromotion(metrics, target, requirements) {
    const reqs = requirements || [];
    const gaps = reqs.filter(req => Number(metrics[req.key] || 0) < Number(req.v))
      .map(req => ({ key: req.key, label: req.l, current: Number(metrics[req.key] || 0), required: Number(req.v), missing: Number(req.v) - Number(metrics[req.key] || 0) }));
    return {
      target,
      requirements: reqs.length,
      met: reqs.length - gaps.length,
      gaps,
      estimateReady: reqs.length > 0 && gaps.length === 0,
      confidence: 'planning-estimate',
      warning: /^(QDS|SQD)$/.test(target) ? 'Personal recruitment and current UW planner eligibility cannot be confirmed from this extract.' : 'Confirm this estimate against the current UW promotion planner before acting.'
    };
  }

  return { activityFor, evaluatePromotion };
});
