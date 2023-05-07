import { createApp } from 'vue'
import App from './App.vue'

import {
  Cell,
  CellGroup,
  Button,
  Toast,
  Icon,
  Collapse,
  CollapseItem,
  TextEllipsis
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(Button)
app.use(Toast)
app.use(Cell)
app.use(CellGroup)
app.use(Icon)
app.use(Collapse)
app.use(CollapseItem)
app.use(TextEllipsis)

app.mount('#app')
