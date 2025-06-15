import React from 'react';
import {View, LogBox} from 'react-native';
import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryStack,
  VictoryLine,
  VictoryTheme,
  VictoryLegend,
} from 'victory-native';

const CustomSalesChart = ({chartData = []}) => {
  LogBox.ignoreLogs([
    'border: support for defaultProps will be removed', // match part of the warning text
  ]);
  // Prepare stacked bar data
  const barSold = chartData.map(d => ({
    x: d.week,
    y: d.sold,
  }));

  const barUnsold = chartData.map(d => ({
    x: d.week,
    y: d.total - d.sold,
  }));

  // Prepare line chart data
  const lineAmount = chartData.map(d => ({
    x: d.week,
    y: d.amount,
  }));

  return (
    <View>
      <VictoryChart
        domainPadding={{x: 30}}
        height={300}
        theme={VictoryTheme.material}>
        {/* Legend */}
        <VictoryLegend
          x={50}
          y={10}
          orientation="horizontal"
          gutter={20}
          data={[
            {name: 'Unsold', symbol: {fill: '#fbbc04'}},
            {name: 'Sold', symbol: {fill: '#34a853'}},
            {name: 'Amount', symbol: {fill: '#000', type: 'minus'}},
          ]}
          style={{
            labels: {fontSize: 12},
          }}
        />

        {/* Y-Axis */}
        <VictoryAxis
          dependentAxis
          tickFormat={t => `${t}K`}
          style={{
            tickLabels: {fontSize: 10},
            axis: {stroke: '#ccc'},
            grid: {stroke: '#e6e6e6'},
          }}
        />

        {/* X-Axis */}
        <VictoryAxis
          style={{
            tickLabels: {fontSize: 10, padding: 10},
          }}
        />

        {/* Stacked Bar Chart */}
        <VictoryStack colorScale={['#fbbc04', '#34a853']}>
          <VictoryBar data={barUnsold} />
          <VictoryBar data={barSold} />
        </VictoryStack>

        {/* Line Chart */}
        <VictoryLine
          data={lineAmount}
          style={{
            data: {stroke: '#000', strokeWidth: 2},
          }}
        />
      </VictoryChart>
    </View>
  );
};

export default CustomSalesChart;
