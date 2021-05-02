# NodeBB Category-based Chatroom

A NodeBB Plugin that allows users to chat in a category-based chatroom.

## Configuration

Clone the repository. Open the terminal on the repository directory and run this command:

```bash
npm link
```

Then, navigate to your NodeBB repository and run this command:

```bash
npm link <the directory to this repo>
```

Next, run NodeBB and log in as administrator. Head to the admin panel. Click on the "Plugin" tab and activate `nodebb-plugin-category-chatroom` plugin. Restart NodeBB and refresh the page. 

Next, head to `Extend` -> `Widgets`. From the `tpl` options, select `category.tpl`. Put the widget whereever you think is suitable. Restart NodeBB.

Head to your forum, select any category. A button to enter chatroom should appear based on where did you put the widget. Remember to hide the widget to guest users!
