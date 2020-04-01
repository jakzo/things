// import React, { ReactNode } from 'react';

// // Spec for shape is the React shape

// /* eslint-disable react/react-in-jsx-scope */
// /* eslint-disable react/display-name */

// type Framework = 'react' | 'reactNative' | 'angular';
// interface Frameworks {
//   react: {
//     shape: {};
//   };
// }
// type Interaction = 'click' | 'mousedown' | 'touchdown';
// interface ComponentSpec {
//   interactions: {
//     [K in Interaction]?: {
//       [K in keyof Framework]?: { prop: string };
//     };
//   };
//   children: string[];
//   shape: {
//     [K in keyof Framework]?: Frameworks[K];
//   };
// }
// const createComponent = (component: ComponentSpec) => component;

// export const Box = createComponent({
//   interactions: {
//     click: {
//       react: { prop: 'onClick' },
//     },
//   },
//   children: ['children'],
//   shape: {
//     react: props => <div>{props.children}</div>,
//   },
// });

// export const Button = createComponent({
//   state: {},
//   interactions: {
//     click: {
//       react: { prop: 'onClick' },
//     },
//     mousedown: {
//       react: { prop: 'onMousedown' },
//     },
//     touchdown: {
//       react: { prop: 'onTouchdown' },
//     },
//   },
//   shape: {
//     react: (props: { contents: string }) => <Box>{props.contents}</Box>,
//   },
// });
