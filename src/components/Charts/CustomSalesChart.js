import React from 'react';
import {View, Text, Dimensions} from 'react-native';
import {StackedBarChart, LineChart} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 32;

const CustomSalesChart = ({data = [], isMonthly = false}) => {
  // If data is not yet loaded or is empty
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={{padding: 16}}>
        <Text style={{textAlign: 'center', color: '#999'}}>
          No chart data available
        </Text>
      </View>
    );
  }

  // Sanitize and validate chart data
  const chartData = data.map(item => {
    const amountRaw = String(item.amount ?? '0').replace(/^0+/, '');
    const amount = parseInt(amountRaw || '0', 10) || 0;
    const sold = parseInt(item.sold || 0, 10) || 0;
    const total = parseInt(item.total || 0, 10) || 0;
    const available = Math.max(total - sold, 0);
    const week = item.week || '';

    return {week, sold, available, amount};
  });

  const labels = chartData.map(item => item.week);
  const stackedData = chartData.map(item => [item.sold, item.available]);
  const lineData = chartData.map(item =>
    Number.isFinite(item.amount) ? item.amount : 0,
  );

  // Check if stackedData is all zeros
  const isAllZero = stackedData.every(pair => pair.every(value => value === 0));

  // Guard: prevent crash if labels mismatch or invalid data
  const isValid =
    labels.length === stackedData.length &&
    labels.length === lineData.length &&
    lineData.every(val => typeof val === 'number' && !isNaN(val));

  if (!isValid || isAllZero) {
    return (
      <View style={{padding: 16}}>
        <Text style={{textAlign: 'center', color: '#999'}}>
          No chart data available
        </Text>
      </View>
    );
  }

  return (
    <View style={{padding: 0}}>
      <Text
        style={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 16,
          marginBottom: 10,
        }}>
        {isMonthly ? 'Monthly' : 'Weekly'} Sales Performance
      </Text>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
        <View
          style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}}>
          <View
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#4caf50',
              marginRight: 6,
              borderRadius: 2,
            }}
          />
          <Text style={{color: '#000'}}>Sold</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#f8d7a9',
              marginRight: 6,
              borderRadius: 2,
            }}
          />
          <Text style={{color: '#000'}}>Available</Text>
        </View>
      </View>

      {/* Stacked Bar Chart */}
      <StackedBarChart
        data={{
          labels,
          data: stackedData,
          barColors: ['#4caf50', '#f8d7a9'],
        }}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: () => '#000',
        }}
        style={{marginBottom: 20, borderRadius: 8}}
        fromZero
        showLegend={false}
      />

      {/* Line Chart */}
      <LineChart
        data={{
          labels,
          datasets: [{data: lineData}],
        }}
        width={screenWidth}
        height={220}
        yAxisLabel="₱"
        formatYLabel={y => (parseInt(y, 10) >= 1000 ? `${y / 1000}K` : y)}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          labelColor: () => '#000',
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#2196f3',
          },
        }}
        bezier
        style={{borderRadius: 8}}
        fromZero
      />
    </View>
  );
};

export default CustomSalesChart;
