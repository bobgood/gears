// Function to calculate the radius at a given angle using the interpolated involute curve
function involuteRadius(rBase, rTip, theta, thetaMax, pressureAngle) {
    // Calculate the base scaling factor based on the involute formula
    const numerator = Math.sqrt(1 + Math.pow(theta / Math.tan(pressureAngle), 2)) - 1;
    const denominator = Math.sqrt(1 + Math.pow(thetaMax / Math.tan(pressureAngle), 2)) - 1;
    const scalingFactor = numerator / denominator;
    
    // Calculate the radius at angle theta
    const radius = rBase + (rTip - rBase) * scalingFactor;
    return radius;
}

function gear(outline, inline, teeth, rBase, rTip, toothCount, tipFrac, pressureAngle, voluteSegments)
{
    for (i=0; i<toothCount; i++)
    {
        tooth=[];
        addTooth(outline, inline, tooth, rBase, rTip, i, toothCount, tipFrac, pressureAngle, voluteSegments);
        teeth.push(tooth);
    }
}

function addTooth(outline, inline, tooth, rBase, rTip, toothIndex, toothCount, tipFrac, pressureAngle, voluteSegments)
{
    // Calculate the angle span of the tooth
    const toothAngle = 2 * Math.PI / toothCount;
    var fsum= 1/rBase + 1/rTip;
    var fTip = .2;//1/rTip/fsum;
    var fBase = .8; //1/rBase/fsum;
    const tipAngle = tipFrac * toothAngle*fTip;
    const baseAngle = tipFrac * toothAngle*fBase;
    
    // Calculate the base and tip angles of the tooth
    var angle = toothIndex * toothAngle - baseAngle/2;

    const voluteAngle = (1-tipFrac) * toothAngle/2;
    addFlat(outline, inline, rBase, angle, baseAngle);
    angle += baseAngle;
    addFlatPoint(inline, rBase, angle);
    addVolute(outline, tooth, rBase, rTip, angle, voluteAngle, voluteSegments, pressureAngle);
    angle += voluteAngle;
    addFlat(outline, tooth, rTip, angle, tipAngle);
    angle += tipAngle;
    addVolute(outline, tooth, rTip, rBase, angle, voluteAngle, voluteSegments, pressureAngle);
    angle += voluteAngle;
    addFlatPoint(tooth, rBase, angle);
}

function addFlat(stack, stack2, radius, startAngle, angleDifference) {
    var x = radius * Math.cos(startAngle);
    var y = radius * Math.sin(startAngle);
    stack.push({ x, y });
    stack2.push({ x, y });
}

function addFlatPoint(stack, radius, startAngle) {
    var x = radius * Math.cos(startAngle);
    var y = radius * Math.sin(startAngle);
    stack.push({ x, y });
}

function addVolute(stack, stack2, rStart, rEnd, startAngle, angleDifference, numSegments, pressureAngle) {
    // Generate points along the arc
    for (let i = 0; i < numSegments; i++) {
        const angle = startAngle + (i / numSegments) * angleDifference;
        var radius;
        if (rEnd<rStart)
        {
            radius = involuteRadius(rStart, rEnd, angle-startAngle, angleDifference, pressureAngle);
        }
        else
        {
            radius = involuteRadius(rEnd, rStart, angleDifference-(angle-startAngle), angleDifference, pressureAngle);
        }
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        stack.push({ x, y });
        stack2.push({ x, y });
    }
}
