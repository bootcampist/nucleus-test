import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CircleCheckBig , CircleX, CirclePlus, Save, PenLine } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuthContext } from "../hooks/useAuthContext";

const TaskList = () => {
  const {id} = useParams(); //get task id
  const [taskData, setTaskData] = useState({
    id:'',
    index:''
  }); //set id and index outside map
  const [tasksdb, setTasksdb] = useState([]);
  const [tasks, setTasks] = useState([]); // state for empty array of tasks
  const [newTaskText, setNewTaskText] = useState(""); // set initial text of a new task as an empty string
  const [isModalOpen, setIsModalOpen] = useState(false); // set state of modal open to false
  const [editingTaskIndex, setEditingTaskIndex] = useState(null); // state for editing tasks
  const inputRef = useRef(null);
  const {user} = useAuthContext();

  // Set the headers configuration for the request
  const userData = {
    headers: {
      // Authorization: `Bearer ${'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWY4ZmE1MGE0N2U4NDMxOTZkYmVmYjYiLCJpYXQiOjE3MTA4NDE4NzIsImV4cCI6MTcxMTcwNTg3Mn0.gEsIgBS_0CNrRVWU7eVdeCfmX0Lm0Er-zDPOlSvMsRc'}`,
      Authorization: `Bearer ${user?.token}`,

    }
  };

useEffect(() => {
  if (isModalOpen && inputRef.current) {
    inputRef.current.focus();
  }
}, [isModalOpen])

  const openModal = () => {
    setIsModalOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTaskText("");
    setEditingTaskIndex(null); // Reset editing state
  };

  //get all tasks from database and re-render when the tasks value changes
  useEffect(() => {
    if(user){
      axios.get('https://nucleus-deploy.vercel.app/tasks', userData)
          .then(result => {let taskdb = result.data; return taskdb})
          .then(data => {setTasks(data)})
          .catch(err => console.log(err));
    } else {
      // setTasks([]);
    }   
  }, [tasks, user])

  const addTask = () => {
    if (newTaskText.trim() !== "") {
      setTasks([...tasks, { id: tasks.length + 1, text: newTaskText }]);
      setNewTaskText("");
      setIsModalOpen(false);
      axios.post('https://nucleus-deploy.vercel.app/tasks', {newTaskText}, userData) //send new task to database
        .then(result => {
            console.log('result', newTaskText, result)
          })
          .catch(err => console.log(err))
    }
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const editTask = (index, id) => {
    setTaskData({
      id: id, 
      index: index}) //set task data with index and id values for modal to access
      console.log('Task Data', taskData);
    setEditingTaskIndex(index);
    setNewTaskText(tasks[index].newTaskText); // Set the text of the editing task
    axios.get('https://nucleus-deploy.vercel.app/tasks/'+id, userData) //get task from database by id
        .then(result => {console.log('editTask',result)
            console.log('result',result.data.newTaskText)
        })
        .catch(err => console.log(err))
    openModal();
  };

  const updateTask = (id) => {
    if (newTaskText.trim() !== "") {
      const updatedTasks = [...tasks];
      updatedTasks[editingTaskIndex] = { ...updatedTasks[editingTaskIndex], text: newTaskText };
      setTasks(updatedTasks);
      console.log('update task', id);

      axios.put('https://nucleus-deploy.vercel.app/tasks/'+id, {newTaskText}, userData) //update task in the database with the input id
        .then(result => {
            console.log(result)
                    })
        .catch(err => console.log(err))
      closeModal();
    }
  };

  const handleDelete = (id) => {
    axios.delete('https://nucleus-deploy.vercel.app/tasks/'+id, userData) //delete task from the database with the input id
    .then(res => console.log(res))
    .catch(error => console.log(error))
}

  const handleKeyDown = (e,id) => {
    if (e.key === "Enter") {
      if (editingTaskIndex !== null) {
        updateTask(id); // If editing, update the task
      } else {
        addTask(); // Otherwise, add a new task
      }
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newTasks = Array.from(tasks);
    const [removed] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, removed);

    setTasks(newTasks);
  };

  const updateAddButton = () => {
    if (editingTaskIndex !== null) {
      return (
        <Save size={20} />
      )
    } else if (editingTaskIndex == null){
      return (
        <CirclePlus size={20} />
      )
    }
  }

  return (
    <div> {user && (   
      <h3 className="text-5xl mb-5">Task List</h3>
     )}  
      <div className="task-container max-h-dvh my-3 overflow-auto">
        {user && (
        <div id="task-db-container">
          {
            tasks.map((task, index)=>{ 
              return <div className="tasklist" key={task.id}>
                        <DragDropContext onDragEnd={onDragEnd}>
                          <Droppable droppableId="task-list">
                            {(provided) => (
                              <div
                                className="task-container"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {/* {tasks.map((task, index) => ( */}
                                  
                                  <Draggable key={task._id} draggableId={task._id} index={index}>
                                    {(provided) => (
                                      <div
                                        className="task-item my-3 pe-5 py-1 flex justify-between items-center group"
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        {editingTaskIndex === index ? (
                                          <input
                                            className="rounded-full border-2 border-slate-500 w-full px-5 py-2"
                                            type="text"
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            onKeyDown={(e)=>{handleKeyDown(e, task._id)}}
                                            ref={inputRef}
                                          />
                                        ) : (
                                          <span className="rounded-full border-2 border-slate-500 w-full px-5 py-2">{task.newTaskText}</span>
                                        )}
                                        <div className="flex justify-start items-center">
                                          <button className="group-hover:visible group-hover:scale-100 invisible scale-0 origin-left duration-500 ms-3 border-2 border-blue-500 hover:bg-sky-500 rounded-full p-2 my-auto text-slate-50" onClick={() => editTask(index, task._id)}><PenLine size={15} /></button>
                                          <button className="group-hover:visible group-hover:scale-100 invisible scale-0 origin-left duration-500 ms-3 border-2 border-green-500 hover:bg-emerald-600 rounded-full p-2 my-auto text-slate-50" onClick={() => handleDelete(task._id)}><CircleCheckBig size={15}/></button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                {/* ))} */}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                              
                      </div>
            })
          }
      </div>
        )}
        
        {/* Drag and Drop went here */}
      </div>
      {user && (
      <button className="mt-5 mb-3 border-2 px-3 py-1 rounded-full bg-green-300 hover:bg-green-500 duration-500 text-slate-950" onClick={openModal}><CirclePlus className="inline" size={20} /> Task</button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="task-modal my-3">
          <div className="modal-content flex items-center">
            <span className="close me-3 rounded-full p-2 border-2 border-rose-800 hover:bg-rose-500 duration-500 cursor-pointer text-slate-50" onClick={closeModal}><CircleX size={20} /></span>
            <input
              className="py-2 px-5 rounded-full w-fit"
              type="text"
              placeholder="Enter Task"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e)=>{handleKeyDown(e, taskData.id)}}
              ref={inputRef}
            />
            <button className="ms-3 rounded-full p-2 border-2 border-green-500 hover:bg-emerald-600 duration-500 cursor-pointer text-slate-50" onClick={editingTaskIndex !== null ? (e)=>{updateTask(taskData.id)} : addTask}>
              {updateAddButton(editingTaskIndex)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
