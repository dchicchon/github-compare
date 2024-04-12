import { ECharts } from 'echarts-solid';
import { createEffect, createSignal } from 'solid-js';
// import { Container, Stack, TextField } from '@suid/material';
// import { createEffect, createSignal } from 'solid-js';

// we should offer other types of graphs too
/**
 * https://docs.github.com/en/rest/activity/watching?apiVersion=2022-11-28
 * see how many watching
 *
 * https://docs.github.com/en/rest/activity/starring?apiVersion=2022-11-28
 * see how many stars
 *
 * https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28
 * list the issues with a repository
 */

function createData(data) {
  const baseOptions = {
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    toolbox: {
      right: 10,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      name: 'time',
      type: 'category',
      data: [],
    },
    yAxis: {
      name: 'Number of Commits',
      type: 'value',
    },
    series: [{ name: '' }],
  };
  // for now lets work with just one data point
  if (data.length === 0) return baseOptions;
  const weekArray = data[0].data.map((d) => {
    return new Date(d.week * 1000).toLocaleDateString();
  });
  const seriesData = data.map((repo) => {
    return {
      name: repo.title,
      type: 'line',
      data: repo.data.map((d) => d.total),
    };
  });

  baseOptions.xAxis.data = weekArray;
  baseOptions.series = seriesData;
  return baseOptions;
}

function Chart(props) {
  const [option, setOption] = createSignal({});
  createEffect(() => {
    console.log('getting new data');
    setOption(createData(props.data));
  });
  return (
    <ECharts lazyUpdate={true} option={option()} theme="dark" width={600} height={400} />
  );
}

export default Chart;
