var number = 0;

/* Функции для обработки даты и времени */

function parseDateTime(str) {
  var d = str.split(/\D/);
  return new Date(d[2], d[1] - 1, d[0], d[4], d[5], d[6]);
}

function daysWord(days) {
  const lastFigure = parseInt(
    days.toString().substr(days.toString().length - 1, 1),
  );
  if (lastFigure == 1) return " День";
  if (lastFigure > 1 && lastFigure < 5) return " Дня";
  if (lastFigure == 0 || lastFigure >= 5) return " Дней";
}

function hoursWord(hours) {
  const lastFigure = parseInt(
    hours.toString().substr(hours.toString().length - 1, 1),
  );
  if (lastFigure == 1) return " Час";
  if (lastFigure > 1 && lastFigure < 5) return " Часа";
  if (lastFigure == 0 || lastFigure >= 5) return " Часов";
}

function minutesWord(min) {
  const lastFigure = parseInt(
    min.toString().substr(min.toString().length - 1, 1),
  );
  if (lastFigure == 1) return " Минута";
  if (lastFigure > 1 && lastFigure < 5) return " Минуты";
  if (lastFigure == 0 || lastFigure >= 5) return " Минут";
}

function dhm(t) {
  var cd = 24 * 60 * 60 * 1000,
    ch = 60 * 60 * 1000,
    d = Math.floor(t / cd),
    h = Math.floor((t - d * cd) / ch),
    m = Math.round((t - d * cd - h * ch) / 60000);
  // pad = function (n) {
  //   return n < 10 ? "0" + n : n
  // }
  if (m === 60) {
    h++;
    m = 0;
  }
  if (h === 24) {
    d++;
    h = 0;
  }

  var days = daysWord(d);
  var hours = hoursWord(h);
  var mins = minutesWord(m);

  return d + days + " " + h + hours + " " + m + mins;
}

/* Функции для обработки даты и времени */

function createApp(tasks) {
  return new Vue({
    delimiters: ["[[", "]]"],
    el: "#app",
    data: {
      tasks: tasks,
      categories: ["planned", "in_progress", "completed"],
      currentTheme: getCookie("currentTheme", "light"),
      formShown: false,
      currentTask: null,
      originalTaskStatus: null,
      currentTaskID: null,
      currentTaskStatus: "planned",
      showStart: false,
      showEnd: false,
    },
    computed: {
      plannedTasks: function () {
        return this.tasks["planned"];
      },
      tasksInProgress: function () {
        return this.tasks["in_progress"];
      },
      completedTasks: function () {
        return this.tasks["completed"];
      },
    },
    methods: {
      showEditForm: function (category, id) {
        this.originalTaskStatus = category;
        this.currentTaskStatus = category;
        this.currentTaskID = id;
        this.currentTask = this.tasks[category][id];
        this.formShown = true;
      },
      hideEditForm: function () {
        this.formShown = false;
      },
      saveEditForm: function () {
        //console.log(this.currentTaskStatus);

        if (this.currentTaskStatus != this.originalTaskStatus) {
          this.moveCurrentTaskToCategory(this.currentTaskStatus);
        } else if (this.currentTaskStatus == "completed") {
          const diffTime = Math.abs(
            parseDateTime(this.currentTask.end_date) -
            parseDateTime(this.currentTask.start_date),
          );
          this.currentTask.spent = dhm(diffTime);
        }
        this.hideEditForm();
      },
      moveCurrentTaskToCategory(category) {
        if (this.originalTaskStatus != category) {
          this.tasks[category].push(this.currentTask);
          this.deleteTask(this.originalTaskStatus, this.currentTaskID);
          const start_date = new Date();
          if (
            this.originalTaskStatus == "planned" &&
            category == "in_progress"
          ) {
            let dateTime = start_date.toLocaleString();
            this.currentTask.start_date = dateTime;
            this.showStart = true;
          } else if (
            this.originalTaskStatus == "completed" &&
            category == "in_progress"
          ) {
            this.currentTask.end_date = "";
            this.currentTask.spent = "";
            this.showStart = true;
            this.showEnd = false;
          } else if (category == "planned") {
            this.showStart = false;
            this.showEnd = false;
            this.currentTask.start_date = "";
            this.currentTask.end_date = "";
            this.currentTask.spent = "";
          } else if (category == "completed") {
            let end_date = new Date();
            let dateTime = end_date.toLocaleString();
            this.currentTask.end_date = dateTime;
            if (this.originalTaskStatus == "planned") {
              let startDateTime = start_date.toLocaleString();
              this.currentTask.start_date = startDateTime;
            }
            const diffTime = Math.abs(
              parseDateTime(dateTime) -
              parseDateTime(this.currentTask.start_date),
            );
            this.currentTask.spent = dhm(diffTime);
            this.showStart = true;
            this.showEnd = true;
          }
        }
      },
      getTasksByCategory: function (category) {
        this.tasks[category].sort(compareTasks);
        return this.tasks[category];
      },
      countTasksbyCategory: function (category) {
        return this.tasks[category].length;
      },
      switchTheme: function () {
        var nextTheme = { dark: "light", light: "dark" }[this.currentTheme];
        Cookies.set("currentTheme", nextTheme, { samesite: "strict" });
        this.currentTheme = nextTheme;
        setBodyTheme(this.currentTheme);
      },
      editTask: function (category, id) {
        // console.log("Called editTask()" + category + id);
      },
      dragStart: function (event) {
        event.dataTransfer.setData("card.props", event.target.id);
        // console.log(event.target.id);
      },
      allowDrop: function (event) {
        event.preventDefault();
      },
      drop: function (event, newStatus) {
        event.preventDefault();
        var prop_arr = event.dataTransfer.getData("card.props").split(":");
        // console.log(event.dataTransfer.getData("card.props"));
        var id = parseInt(prop_arr[0]);
        var old_status = prop_arr[1];
        var task = this.tasks[old_status][id];
        this.deleteTask(old_status, id);
        this.tasks[newStatus].push(task);
        const start_date = new Date();
        if (old_status == "planned" && newStatus == "in_progress") {
          let dateTime = start_date.toLocaleString();
          task.start_date = dateTime;
          this.showStart = true;
        } else if (old_status == "completed" && newStatus == "in_progress") {
          task.end_date = "";
          task.spent = "";
          this.showEnd = false;
          this.showStart = true;
        } else if (newStatus == "planned") {
          this.showStart = false;
          this.showEnd = false;
          task.start_date = "";
          task.end_date = "";
          task.spent = "";
        } else if (newStatus == "completed" && old_status != "completed") {
          let end_date = new Date();
          let dateTime = end_date.toLocaleString();
          task.end_date = dateTime;
          if (old_status == "planned") {
            let startDateTime = start_date.toLocaleString();
            task.start_date = startDateTime;
          }
          const diffTime = Math.abs(
            parseDateTime(task.end_date) - parseDateTime(task.start_date),
          );
          task.spent = dhm(diffTime);
          this.showStart = true;
          this.showEnd = true;
        }
      },
      confirmTask: function (category, id) {
        nextCategory = "in_progress";
        if (category == "in_progress") nextCategory = "completed";
        var task = this.tasks[category][id];
        this.tasks[nextCategory].push(task);
        this.deleteTask(category, id);
        // console.log("Called confirmTask()");
        const start_date = new Date();
        if (nextCategory == "in_progress") {
          let dateTime = start_date.toLocaleString();
          task.start_date = dateTime;
          this.showStart = true;
        } else if (nextCategory == "completed") {
          let end_date = new Date();
          let dateTime = end_date.toLocaleString();
          task.end_date = dateTime;
          const diffTime = Math.abs(
            parseDateTime(dateTime) -
            parseDateTime(task.start_date),
          );
          task.spent = dhm(diffTime);
          this.showStart = true;
          this.showEnd = true;
        }
      },
      deleteTask: function (category, id) {
        if (category == "completed") {
          this.showStart = false;
          this.showEnd = false;
        }
        this.tasks[category].splice(id, 1);
        // console.log("Called deleteTask()");
      },
    },
    watch: {},
  });
}

function getCookie(name, defaultValue) {
  var val = Cookies.get(name);
  return val === undefined ? defaultValue : val;
}

function compareTasks(task1, task2) {
  if (task1["start_date"] !== undefined && task2["start_date"] !== undefined) {
    if (task1["start_date"] < task2["start_date"]) {
      return -1;
    }
    return 1;
  }
  return compareTasksByName(task1, task2);
}
function setBodyTheme(name) {
  let oldClass = { dark: "light", light: "dark" }[name];
  document.body.classList.remove(oldClass);
  document.body.classList.add(name);
}
function compareTasksByName(task1, task2) {
  if (task1["name"].toLowerCase() < task2["name"].toLowerCase()) {
    return -1;
  }
  return 1;
}
Vue.component("add-task", {
  delimiters: ["[[", "]]"],
  template: `
	<form
		id="addTask"
		@submit.prevent="createNewTask()"
	>
		<p v-if="error">
			<b>[[ error ]]</b>
			<ul>
			</ul>
		</p>
	<p>
	<label style="display: block;margin-bottom: 1em;" :class="'task-creation ' + currentTheme" for="name">Впишите свою задачу</label>
	<input
		:class="'input ' + currentTheme"  
		id="name"
		v-model="newTaskTitle"
		type="text"
		name="name"
	>
	<input
		:class="'input ' + currentTheme"
		type="submit"
		value="+"
	>
	</p>
	</form>`,
  data() {
    return {
      error: null,
      newTaskTitle: null,
    };
  },
  methods: {
    createNewTask: function () {
      if (!this.newTaskTitle) {
        this.error = "Укажите название.";
      } else {
        number++;
        // console.log(number);
        var Task = {
          number: number,
          name: this.newTaskTitle,
          description: "",
          start_date: "",
          end_date: "",
          spent: "",
          assignee: "",
        };
        this.$root.tasks["planned"].push(Task);
        this.$root.showStart = this.$root.showEnd = false;
        this.newTaskTitle = null;
        this.error = null;
      }
    },
  },
  computed: {
    isDark: function () {
      return this.$root.currentTheme == "dark";
    },
    currentTheme: function () {
      return this.$root.currentTheme;
    },
  },
});
Vue.component("theme-cell", {
  delimiters: ["[[", "]]"],
  template: `<span v-if="isDark">Темная тема</span>
  <span v-else>Светлая тема</span>`,
  computed: {
    isDark: function () {
      return this.$root.currentTheme == "dark";
    },
  },
});
Vue.component("count-cell", {
  delimiters: ["[[", "]]"],
  props: ["status"],
  template: `<span>[[ countTasks ]]</span>`,
  computed: {
    countTasks: function () {
      return this.count();
    },
  },
  methods: {
    count: function () {
      return this.$root.countTasksbyCategory(this.status);
    },
  },
});
Vue.component("panel-cell", {
  delimiters: ["[[", "]]"],
  props: ["status"],
  template: `<div :class="'work-field ' + currentTheme" v-on:drop="drop($event, status)" v-on:dragover="allowDrop">
      <!--draggable :list="tasks['planned']" group="cards" class="list-group"-->
\t    <h2><span v-if="status == 'planned'">Запланировано</span>
      <span v-if="status == 'in_progress'">В работе</span>
      <span v-if="status == 'completed'">Готово</span>
      &nbsp;(<count-cell :status="status"></count-cell>)</h2>
      <template v-for="(task, index) in tasks">
          <task-cell :task="task" :card_id="index" :status="status"></task-cell>
      </template>
      <!--/draggable-->
    </div>`,
  computed: {
    tasks: function () {
      return this.$root.tasks[this.status];
    },
    currentTheme: function () {
      return this.$root.currentTheme;
    },
  },
  methods: {
    drop: function (event, newStatus) {
      return this.$root.drop(event, newStatus);
    },
    allowDrop: function (event) {
      return this.$root.allowDrop(event);
    },
  },
});
Vue.component("task-cell", {
  delimiters: ["[[", "]]"],
  props: ["task", "status", "card_id"],
  template: `<!--draggable-->
      <div :class="'card list-group-item ' + currentTheme " :id="elemID" draggable="true" v-on:dragstart="dragStart">
		<h2 class='card-number'>Задача [[ task['number'] ]]</h2>
		  <h3 class='card-name'>[[ task['name'] ]]</h3>
          <div class="task-field">
          <span v-if="task['description'] !== undefined && task['description'] != ''">[[ task['description'] ]]</span>
		  <div v-if="status == 'in_progress' || status == 'completed'">
		  <p class="properties-key" v-if="task['start_date'] !== undefined && task['start_date'] != ''">
            <div style="font-weight: bold;">Дата и время начала</div>
            <div>[[ task['start_date'] ]]</div>
		  </p>
		  </div>
		  <div v-if="status == 'completed'">
          <p class="properties-key" v-if="task['end_date'] !== undefined && task['end_date'] != ''">
            <div style="font-weight: bold;">Дата и время окончания</div>
            <div>[[ task['end_date'] ]]</div>
		  </p>
          <p class="properties-key" v-if="task['spent'] !== undefined && task['spent'] != ''">
            <div style="font-weight: bold;">Затрачено времени</div>
            <div>[[ task['spent'] ]]</div>
		  </p>
		  </div>
          <p class="properties-key" v-if="task['assignee'] !== undefined && task['assignee'] != ''">
            <div style="font-weight: bold;"><!-- Дофига --> Ответственный</div>
            <div>[[ task['assignee'] ]]</div>
          </p>
        </div>
        <div>
          <button @click="editTask"><img src="redact.png" width="15" height="15"> </button>
          <button class="button-img" v-if="status != 'completed'" @click="confirmTask"><img src="yes.png" width="15" height="15"> </button>
          <button img class="button-img" v-else @click="deleteTask"><img src="no.png" width="15" height="15"></button>
          <style>
          .button-img{
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          background-color: #9d9d9d;
          border-radius: 50px;
          border:1px solid gray;
          }
        </style>
        </div>
      </div>
	<!--/draggable-->`,
  computed: {
    currentTheme: function () {
      return this.$root.currentTheme;
    },
    elemID: function () {
      return this.card_id + ":" + this.status;
    },
  },
  methods: {
    editTask: function () {
      // console.log(this.status);
      // console.log(this.card_id);
      return this.$root.showEditForm(this.status, this.card_id);
    },
    confirmTask: function () {
      return this.$root.confirmTask(this.status, this.card_id);
    },
    deleteTask: function () {
      return this.$root.deleteTask(this.status, this.card_id);
    },
    dragStart: function (event) {
      return this.$root.dragStart(event);
    },
  }
});
Vue.config.devtools = true;
