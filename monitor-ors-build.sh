#!/bin/bash
echo "🔄 Monitoring ORS Full US Build Progress..."
echo "📊 Expected: ~15-45 minutes for 2.6GB dataset"
echo "📍 Building graph from us-latest.osm.pbf"
echo ""

# Function to check if build is complete
check_completion() {
    # Look for "Finished at" or bounds with actual geographic coordinates
    if docker logs reguroute-ors 2>&1 | tail -10 | grep -q "Finished at:"; then
        echo "✅ Build Complete!"
        echo ""
        echo "📊 Final Statistics:"
        docker logs reguroute-ors 2>&1 | grep -E "(edges|nodes|bounds|Total time)" | tail -5
        echo ""
        echo "🧪 Test with: http://localhost:8080/ors/v2/health"
        echo "🛣️ Try Dallas → Boston routing now!"
        return 0
    fi
    return 1
}

# Check every 30 seconds
while true; do
    clear
    echo "🔄 ORS Build Monitor - $(date)"
    echo "========================================"
    
    # Check if completed
    if check_completion; then
        break
    fi
    
    # Show recent progress
    echo "📈 Recent Progress:"
    docker logs reguroute-ors 2>&1 | tail -5
    echo ""
    
    # Show memory usage if available
    if docker logs reguroute-ors 2>&1 | tail -10 | grep -q "memory:"; then
        echo "💾 Memory Usage:"
        docker logs reguroute-ors 2>&1 | tail -10 | grep "memory:" | tail -1
        echo ""
    fi
    
    # Show container status
    echo "🐳 Container Status:"
    docker ps | grep reguroute-ors
    echo ""
    
    echo "⏱️ Checking again in 30 seconds... (Ctrl+C to stop monitoring)"
    sleep 30
done