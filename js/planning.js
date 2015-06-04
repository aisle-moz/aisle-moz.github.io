var bzapi = 'https://bugzilla.mozilla.org/rest/bug';
var bugsquery = {
    include_fields: "id,summary,resolution,status,cf_user_story,whiteboard,blocks,depends_on,assigned_to,priority",
    component: "Aisle",
    product: "Localization Infrastructure and Tools"
};
var bugs = {}, milestones = {}, initiatives = [];

$.getJSON(bzapi, bugsquery, console.log.bind(console))
    .done(function(data) {
        analyzeBugs(data.bugs);
        showBugs();
    });

function analyzeBugs(buglist) {
    var milestone = /\[milestone\]\[([^\]]+)\]/;
    var initiative = /\[initiative\]/;
    buglist.forEach(function(bug) {
        bugs[bug.id] = bug;
        var msid;
        if ((msid = milestone.exec(bug.whiteboard))) {
            msid = msid[1];
            bug.milestone = msid;
            if (!milestones[msid]) {
                milestones[msid] = [bug];
            }
            else {
                milestones[msid].push(bug);
            }
        }
        if (initiative.test(bug.whiteboard)) {
            initiatives.push(bug);
        }
    });
    initiatives.sort(function(b1, b2) {
        if (b1.priority < b2.priority) {
            return -1;
        }
        if (b1.priority > b2.priority) {
            return 1;
        }
        return b2.id - b1.id;
    });
}

function showBugs() {
    var template = Array.filter(
        document.getElementById("initiatives").childNodes,
        function(node) {return node.nodeType === Node.COMMENT_NODE;}
    )[0].data;
    initiatives.forEach(function(bug) {
        var summary = bug.summary.replace(/\[Tracker\]\s*/, '');
        var body = '<div class="story">' + bug.cf_user_story + '</div>';
        body += '<table class="table">';
        var total = 0, resolved = 0;
        bug.depends_on.forEach(function(bug_id) {
            total += 1;
            if (bugs[bug_id].resolution !== "") {
                resolved += 1;
            }
            body += '<tr><td><a href="https://bugzil.la/' + bug_id + '">' + bug_id + '</a></td><td>'
                + bugs[bug_id].priority + '</td><td>'
                + bugs[bug_id].status + '</td><td>'
                + bugs[bug_id].summary + '</td></tr>';
        });
        var status = ' (' + resolved + '/' + total + ')';
        body += '</table>';
        var html = template
            .replace(/{{ID}}/g, bug.id)
            .replace(/{{TARGET}}/g, bug.id + "-body")
            .replace(/{{SUMMARY}}/g, summary)
            .replace(/{{STATUS}}/g, status)
            .replace(/{{BODY}}/g, body);
        $(html).appendTo("#initiatives");
    });
}
